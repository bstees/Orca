import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { localRequestGuard } from '../security.js';
import { websocketPlugin } from './websocket.js';

test('rejects a cross-site websocket upgrade before exposing a snapshot', async () => {
  const app = Fastify();
  const getAll = jest.fn(() => []);
  app.addHook('onRequest', localRequestGuard);
  await app.register(fastifyWebsocket);
  await app.register(websocketPlugin, { registry: { getAll } });
  await app.ready();
  try {
    await expect(app.injectWS('/ws/dashboard', {
      headers: { host: 'localhost:7337', origin: 'https://evil.example' },
    })).rejects.toThrow('403');
    expect(getAll).not.toHaveBeenCalled();
  } finally {
    await app.close();
  }
});
