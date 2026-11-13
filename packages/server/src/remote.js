import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { readFileSync } from 'node:fs';
import { createRemoteAuth, remoteToken } from './remote-auth.js';
import { websocketPlugin } from './plugins/websocket.js';
import { staticPlugin } from './plugins/static.js';

export function validateRemoteConfig(config) {
  const origin = new URL(config.origin);
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('ORCA_REMOTE_ORIGIN must be an HTTPS origin without path or credentials');
  }
  if (!config.certPath || !config.keyPath) throw new Error('Remote access requires a TLS certificate and key');
  return origin;
}

export async function createRemoteApp({ config, registry, events, notifier, auth = createRemoteAuth() }) {
  const origin = validateRemoteConfig(config);
  const app = Fastify({ logger: false, bodyLimit: 2048, https: {
    cert: readFileSync(config.certPath), key: readFileSync(config.keyPath), minVersion: 'TLSv1.2',
  } });
  app.decorate('config', { appDistPath: config.appDistPath });
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store').header('Referrer-Policy', 'no-referrer')
      .header('X-Content-Type-Options', 'nosniff')
      .header('Content-Security-Policy', `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${origin.origin.replace('https:', 'wss:')}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
    if (request.headers.host !== origin.host ||
      (request.headers.origin !== undefined && request.headers.origin !== origin.origin)) {
      return reply.code(403).send({ error: 'Origin not allowed' });
    }
    if (request.routeOptions.config.remotePublic === true) return;
    const device = auth.authenticate(remoteToken(request.headers));
    if (!device) return reply.code(401).send({ error: 'Pairing required' });
    request.remoteDevice = device;
  });
  app.post('/api/pair', { config: { remotePublic: true } }, async (request, reply) => {
    const result = auth.pair(request.body?.code);
    if (!result) return reply.code(403).send({ error: 'Invalid, expired or exhausted pairing code' });
    return result;
  });
  app.get('/api/remote', async () => ({ remote: true }));
  app.get('/api/sessions', async () => registry.getAll());
  await app.register(fastifyWebsocket, { options: { maxPayload: 65536, handleProtocols: (protocols) => protocols.has('orca') ? 'orca' : false } });
  await app.register(websocketPlugin, {
    registry, events, notifier, dashboardOnly: true,
    onDashboardSocket: (socket, request) => auth.track(request.remoteDevice, socket),
    authorizeDashboardMessage: (request) => auth.authenticate(remoteToken(request.headers)) === request.remoteDevice,
    messageLimit: 60,
  });
  await app.register(async (publicApp) => {
    publicApp.addHook('onRoute', (route) => { route.config = { ...route.config, remotePublic: true }; });
    await publicApp.register(staticPlugin);
  });
  app.addHook('onClose', async () => auth.revokeAll());
  return { app, auth };
}
