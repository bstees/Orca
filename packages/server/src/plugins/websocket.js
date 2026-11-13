import { SESSION_STATUS } from '@orca/shared';

export function validDashboardMessage(msg) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return false;
  if (typeof msg.sessionId !== 'string' || !msg.sessionId || msg.sessionId.length > 128) return false;
  const fields = { alert_response: 'option', user_prompt: 'prompt', set_approval_mode: 'approvalMode', session_dismissed: null };
  if (typeof msg.type !== 'string' || !Object.hasOwn(fields, msg.type)) return false;
  const field = fields[msg.type];
  return !field || (typeof msg[field] === 'string' && msg[field].length > 0 && msg[field].length <= 4096);
}

/**
 * WebSocket plugin — registers /ws/extension and /ws/dashboard endpoints.
 *
 * Extension connections send session events.
 * Dashboard connections receive broadcast messages.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ registry: import('../registry/sessions.js').SessionRegistry }} opts
 */
export async function websocketPlugin(fastify, { registry, events, notifier, dashboardOnly = false, onDashboardSocket, authorizeDashboardMessage, messageLimit = Infinity }) {
  const dashboardClients = new Set();
  const extensionSockets = new Map(); // sessionId → socket

  function broadcast(message) {
    const payload = JSON.stringify(message);
    for (const client of dashboardClients) {
      if (client.readyState === 1 /* OPEN */) {
        client.send(payload);
      }
    }
  }

  // Broadcast registry-driven updates (e.g. from MCP tools)
  events?.on('session_registered', (session) => {
    broadcast({ type: 'session_registered', session, ts: Date.now() });
  });
  events?.on('status_updated', (session) => {
    broadcast({ type: 'status_updated', sessionId: session.sessionId, status: session.status, message: session.message, options: session.options ?? [], ts: Date.now() });
  });
  events?.on('approval_mode_changed', (session) => {
    broadcast({ type: 'approval_mode_changed', sessionId: session.sessionId, approvalMode: session.approvalMode, ts: Date.now() });
  });

  if (!dashboardOnly) fastify.get('/ws/extension', { websocket: true }, (socket) => {
    socket.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const { type, sessionId, status, message, workspaceName, gitBranch, description, approvalMode } = msg;

      if (type === 'session_registered') {
        const session = registry.register({ workspaceName, gitBranch, description, approvalMode: approvalMode ?? null });
        extensionSockets.set(session.sessionId, socket);
        // Ack with the assigned sessionId so the extension can correlate events
        socket.send(JSON.stringify({ type: 'session_ack', sessionId: session.sessionId }));
      } else if (type === 'status_updated' && sessionId) {
        registry.updateStatus(sessionId, status, message);
      } else if (type === 'alert_response' && sessionId) {
        const responseMessage = `Response: ${msg.option}`;
        // setResponse unblocks orca_wait_for_response polling
        registry.setResponse(sessionId, msg.option);
        registry.updateStatus(sessionId, SESSION_STATUS.RESPONDED, responseMessage, []);
        broadcast({
          type: 'status_updated',
          sessionId,
          status: SESSION_STATUS.RESPONDED,
          message: responseMessage,
          options: [],
          ts: Date.now(),
        });
      } else if (type === 'session_deregistered' && sessionId) {
        extensionSockets.delete(sessionId);
        registry.remove(sessionId);
        broadcast({ type: 'session_removed', sessionId, ts: Date.now() });
      } else if (type === 'session_dismissed' && sessionId) {
        extensionSockets.delete(sessionId);
        registry.remove(sessionId);
        broadcast({ type: 'session_removed', sessionId, ts: Date.now() });
      } else {
        // Forward only unrecognised message types (e.g. alert_notification).
        // session_registered and status_updated are already broadcast via the
        // events listeners above; forwarding them again creates ghost sessions
        // with undefined sessionId in the dashboard.
        broadcast({ ...msg, serverTs: Date.now() });
      }
    });

    socket.on('close', () => {
      // Connection closed — remove the session so the dashboard stays clean.
      // The extension will re-register a fresh session on reconnect.
      for (const [sid, sock] of extensionSockets) {
        if (sock === socket) {
          extensionSockets.delete(sid);
          registry.remove(sid);
          broadcast({ type: 'session_removed', sessionId: sid, ts: Date.now() });
          break;
        }
      }
    });
  });

  fastify.get('/ws/dashboard', { websocket: true }, (socket, request) => {
    onDashboardSocket?.(socket, request);
    let windowStart = Date.now();
    let messageCount = 0;
    dashboardClients.add(socket);

    // Send current session list on connect
    socket.send(JSON.stringify({
      type: 'sessions_snapshot',
      sessions: registry.getAll(),
      ts: Date.now(),
    }));

    socket.on('message', (raw) => {
      if (authorizeDashboardMessage && !authorizeDashboardMessage(request)) { socket.close(4001, 'Pairing expired or revoked'); return; }
      if (Date.now() - windowStart > 10000) { windowStart = Date.now(); messageCount = 0; }
      if (++messageCount > messageLimit) { socket.close(4008, 'Rate limit'); return; }
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (!validDashboardMessage(msg)) return;
      try {
      if (msg.type !== 'set_approval_mode' && registry.get && !registry.get(msg.sessionId)) return;
      const { type, sessionId, option } = msg;

      if (type === 'alert_response' && sessionId && option) {
        registry.setResponse(sessionId, option);
        registry.updateStatus(sessionId, SESSION_STATUS.RESPONDED, `Response: ${option}`, []);
        broadcast({
          type: 'status_updated',
          sessionId,
          status: SESSION_STATUS.RESPONDED,
          message: `Response: ${option}`,
          options: [],
          ts: Date.now(),
        });
        notifier?.post({
          title: 'Response received',
          message: option,
          tags: ['white_check_mark'],
          priority: 'default',
        })?.catch(() => {
          fastify.log?.warn('Notification delivery failed; response was retained');
        });
      } else if (type === 'set_approval_mode' && sessionId && msg.approvalMode) {
        socket.send(JSON.stringify({ type: 'error', code: 'LOCAL_APPROVAL_REQUIRED',
          message: 'Change approval permissions directly in your editor.' }));
      } else if (type === 'user_prompt' && sessionId && msg.prompt) {
        registry.updateStatus(sessionId, SESSION_STATUS.WORKING, `📱 ${msg.prompt}`);
      } else if (type === 'session_dismissed' && sessionId) {
        registry.remove(sessionId);
        broadcast({ type: 'session_removed', sessionId, ts: Date.now() });
      }
      } catch {
        fastify.log?.warn('Rejected dashboard message');
      }
    });

    socket.on('close', () => {
      dashboardClients.delete(socket);
    });
  });
}
