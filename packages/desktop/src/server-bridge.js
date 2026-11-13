'use strict';
const path = require('node:path');
const net = require('node:net');

/**
 * Check if a port already has something listening on it.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => { server.close(); resolve(false); });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Starts the Orca Fastify server in-process.
 * If the port is already occupied (e.g. a standalone `yarn dev` is running)
 * we skip starting a new one and connect to the existing server instead.
 *
 * @param {{ port?: number, dbPath?: string, ntfyTopic?: string }} opts
 * @returns {{ start: () => Promise<{ port: number, external: boolean }>, stop: () => Promise<void> }}
 */
function createServerBridge(opts = {}) {
  const {
    port = parseInt(process.env.ORCA_PORT ?? '7337', 10),
    dbPath = process.env.ORCA_DB_PATH ?? path.join(process.env.HOME ?? '.', 'orca.db'),
    ntfyTopic = process.env.NTFY_TOPIC ?? '',
    ntfyToken = process.env.NTFY_TOKEN ?? '',
    ntfyBaseUrl = process.env.NTFY_BASE_URL ?? 'https://ntfy.sh',
  } = opts;

  let fastify = null;

  return {
    async start() {
      const occupied = await isPortInUse(port);

      if (occupied) {
        // An external server is already running — reuse it, don't start another.
        console.log(`[server-bridge] Port ${port} already in use — connecting to existing server.`);
        return { port, external: true };
      }

      // In production (packaged), use the pre-bundled CJS server.
      // In dev, dynamic-import the live ESM source so edits are picked up.
      let createApp;
      const fs = require('node:fs');
      // Packaged: extraResources puts server.bundle.cjs in Resources/
      // Dev: sits next to server-bridge.js in src/
      const bundleInResources = path.join(process.resourcesPath ?? '', 'server.bundle.cjs');
      const bundleLocal = path.join(__dirname, 'server.bundle.cjs');
      console.log('[server-bridge] resourcesPath:', process.resourcesPath);
      console.log('[server-bridge] bundleInResources:', bundleInResources, 'exists:', fs.existsSync(bundleInResources));
      console.log('[server-bridge] bundleLocal:', bundleLocal, 'exists:', fs.existsSync(bundleLocal));
      const bundlePath = fs.existsSync(bundleInResources) ? bundleInResources : bundleLocal;
      if (fs.existsSync(bundlePath)) {
        ({ createApp } = require(bundlePath));
      } else {
        ({ createApp } = await import('@orca/server/src/index.js'));
      }

      // Tell the static plugin where the pre-built dashboard lives.
      // In packaged app it's in extraResources (process.resourcesPath/app-dist).
      // In dev mode it's in packages/app/dist.
      const appDistPath = fs.existsSync(bundleInResources)
        ? path.join(process.resourcesPath, 'app-dist')
        : path.join(__dirname, '..', '..', 'app', 'dist');

      console.log('[server-bridge] appDistPath:', appDistPath, 'exists:', fs.existsSync(appDistPath));
      const config = {
        port,
        host: '127.0.0.1',
        dbPath,
        ntfy: { baseUrl: ntfyBaseUrl, topic: ntfyTopic, token: ntfyToken },
        appDistPath,
        remote: process.env.ORCA_REMOTE_ORIGIN ? {
          origin: process.env.ORCA_REMOTE_ORIGIN, host: process.env.ORCA_REMOTE_HOST ?? '0.0.0.0',
          port: parseInt(process.env.ORCA_REMOTE_PORT ?? '7443', 10),
          certPath: process.env.ORCA_TLS_CERT, keyPath: process.env.ORCA_TLS_KEY, appDistPath,
        } : null,
      };

      fastify = await createApp(config);
      await fastify.listen({ port: config.port, host: config.host });
      if (fastify.remote) await fastify.remote.app.listen({ port: config.remote.port, host: config.remote.host });

      const address = fastify.server.address();
      return { port: address.port, external: false };
    },

    async stop() {
      if (fastify) {
        await fastify.close();
        fastify = null;
      }
      // If external === true, we don't own the server — leave it running.
    },
  };
}

module.exports = { createServerBridge };
