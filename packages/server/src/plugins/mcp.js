import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

/**
 * Mounts the MCP server using SSEServerTransport (deprecated but functional).
 *
 * Protocol:
 *   GET /mcp          — SSE stream; server sends `event: endpoint` with POST URL
 *   POST /mcp?sessionId=<id> — client sends tool calls/resource reads here
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ mcpServer: import('../mcp/index.js').McpServer }} opts
 */
export async function mcpPlugin(fastify, { mcpServer }) {
  const transports = new Map();

  // SSE endpoint — transport.start() sets headers and sends the endpoint event
  fastify.get('/mcp', (req, reply) => {
    // Hijack prevents Fastify from auto-ending the response
    reply.hijack();

    const transport = new SSEServerTransport('/mcp', reply.raw);
    transports.set(transport.sessionId, transport);

    reply.raw.on('close', () => {
      transports.delete(transport.sessionId);
    });

    // connect() calls transport.start() which writes headers + endpoint event
    mcpServer.connect(transport).catch((err) => {
      fastify.log.error(err, 'MCP connect error');
    });
  });

  // POST endpoint — sessionId comes from the URL query param set by the client
  fastify.post('/mcp', async (req, reply) => {
    const sessionId = req.query.sessionId;
    const transport = transports.get(sessionId);
    if (!transport) {
      return reply.code(404).send({ error: 'MCP session not found' });
    }
    await transport.handlePostMessage(req.raw, reply.raw, req.body);
  });
}
