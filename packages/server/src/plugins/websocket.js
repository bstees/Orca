/**
 * WebSocket plugin — registers /ws/extension and /ws/dashboard endpoints.
 *
 * Extension connections send session events.
 * Dashboard connections receive broadcast messages.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ registry: import('../registry/sessions.js').SessionRegistry }} opts
 */
export async function websocketPlugin(fastify, { registry }) {
  const dashboardClients = new Set();

  function broadcast(message) {
    const payload = JSON.stringify(message);
    for (const client of dashboardClients) {
      if (client.readyState === 1 /* OPEN */) {
        client.send(payload);
      }
    }
  }

  fastify.get('/ws/extension', { websocket: true }, (socket) => {
    socket.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const { type, sessionId, status, message, workspaceName, gitBranch, description } = msg;

      if (type === 'session_registered') {
        registry.register({ workspaceName, gitBranch, description });
      } else if (type === 'status_updated' && sessionId) {
        registry.updateStatus(sessionId, status, message);
      } else if (type === 'session_deregistered' && sessionId) {
        registry.remove(sessionId);
      }

      // Forward all events to dashboard
      broadcast({ ...msg, serverTs: Date.now() });
    });

    socket.on('close', () => {
      // Connection closed — extension disconnected
    });
  });

  fastify.get('/ws/dashboard', { websocket: true }, (socket) => {
    dashboardClients.add(socket);

    // Send current session list on connect
    socket.send(JSON.stringify({
      type: 'sessions_snapshot',
      sessions: registry.getAll(),
      ts: Date.now(),
    }));

    socket.on('close', () => {
      dashboardClients.delete(socket);
    });
  });
}
