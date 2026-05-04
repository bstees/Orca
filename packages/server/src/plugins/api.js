/**
 * REST API routes.
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ registry: import('../registry/sessions.js').SessionRegistry }} opts
 */
export async function apiPlugin(fastify, { registry }) {
  fastify.get('/api/health', async () => ({
    status: 'ok',
    ts: Date.now(),
  }));

  fastify.get('/api/sessions', async () =>
    registry.getAll().sort((a, b) => b.registeredAt - a.registeredAt)
  );
}
