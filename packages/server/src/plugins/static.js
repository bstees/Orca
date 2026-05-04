import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Default: resolve relative to this source file (dev / standalone server)
const DEFAULT_APP_DIST = join(__dirname, '../../../app/dist');

/**
 * Serves the built dashboard app at /.
 * Falls back gracefully when dist doesn't exist yet.
 *
 * Accepts an optional `appDistPath` on `fastify.config` (set by the Electron
 * server-bridge) so the packaged app can point to the correct Resources path.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
export async function staticPlugin(fastify) {
  const root = fastify.config?.appDistPath ?? DEFAULT_APP_DIST;
  try {
    await fastify.register(fastifyStatic, {
      root,
      prefix: '/',
      decorateReply: false,
    });
  } catch {
    // dist not built yet — skip static serving
  }
}
