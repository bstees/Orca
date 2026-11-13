import { pathToFileURL } from 'node:url';
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import Database from 'better-sqlite3';
import { EventEmitter } from 'node:events';

import { createRemoteApp } from './remote.js';
import { assertLocalHost, localRequestGuard } from './security.js';
import { loadConfig } from './config.js';
import { createSessionRegistry } from './registry/sessions.js';
import { createNtfyNotifier } from './notifications/ntfy.js';
import { createMcpServer } from './mcp/index.js';
import { websocketPlugin } from './plugins/websocket.js';
import { mcpPlugin } from './plugins/mcp.js';
import { staticPlugin } from './plugins/static.js';
import { apiPlugin } from './plugins/api.js';

/**
 * Build and return the configured Fastify instance without starting it.
 * Accepts an optional config override for embedding in desktop/Electron.
 *
 * @param {import('./config.js').OrcaConfig} [configOverride]
 * @returns {Promise<import('fastify').FastifyInstance>}
 */
export async function createApp(configOverride) {
  const config = configOverride ?? loadConfig();

  assertLocalHost(config.host);
  const db = new Database(config.dbPath);
  const events = new EventEmitter();
  const registry = createSessionRegistry(db, events);
  registry.clear(); // Purge stale sessions from previous server runs
  const notifier = createNtfyNotifier(config.ntfy);
  const mcpServer = createMcpServer(registry, notifier, events);

  const fastify = Fastify({ logger: true });

  fastify.addHook('onRequest', localRequestGuard);

  // Expose config on the instance so plugins (e.g. static) can read it.
  fastify.decorate('config', config);

  await fastify.register(fastifyWebsocket);
  await fastify.register(websocketPlugin, { registry, events, notifier });
  await fastify.register(mcpPlugin, { mcpServer });
  await fastify.register(apiPlugin, { registry });
  await fastify.register(staticPlugin);

  if (config.remote) {
    const remote = await createRemoteApp({ config: config.remote, registry, events, notifier });
    fastify.decorate('remote', remote);
    fastify.post('/api/remote/pairing', async () => ({ code: remote.auth.newPairing(), expiresInSeconds: 300 }));
    fastify.post('/api/remote/revoke', async () => { remote.auth.revokeAll(); return { revoked: true }; });
    fastify.addHook('onClose', async () => remote.app.close());
  }
  return fastify;
}

// Run directly (yarn workspace @orca/server dev / start)
const isMain = process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  (async () => {
    const config = loadConfig();
    const app = await createApp(config);
    await app.listen({ port: config.port, host: config.host });
    if (app.remote) await app.remote.app.listen({ port: config.remote.port, host: config.remote.host });
  })();
}

