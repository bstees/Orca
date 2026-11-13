jest.mock('./plugins/static.js', () => ({ staticPlugin: async () => {} }));
import { createRemoteApp, validateRemoteConfig } from './remote.js';
import { createRemoteAuth } from './remote-auth.js';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir, config;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'orca-tls-test-'));
  config = { origin: 'https://localhost:7443', keyPath: join(dir, 'key.pem'), certPath: join(dir, 'cert.pem') };
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', config.keyPath, '-out', config.certPath, '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' });
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test('remote transport requires HTTPS origin and TLS credentials', () => {
  expect(() => validateRemoteConfig({ origin: 'http://localhost' })).toThrow();
  expect(() => validateRemoteConfig({ origin: 'https://localhost/path' })).toThrow();
  expect(() => validateRemoteConfig({ origin: 'https://localhost' })).toThrow();
});

test('remote API and WS require pairing, enforce origin, and omit extension/MCP routes', async () => {
  const auth = createRemoteAuth();
  const getAll = jest.fn(() => []);
  const { app } = await createRemoteApp({ config, auth, registry: { getAll } });
  await app.ready();
  const headers = { host: 'localhost:7443', origin: 'https://localhost:7443' };
  try {
    expect((await app.inject({ url: '/api/sessions', headers })).statusCode).toBe(401);
    await expect(app.injectWS('/ws/dashboard', { headers })).rejects.toThrow('401');
    expect((await app.inject({ url: '/%61pi/sessions', headers })).statusCode).toBe(401);
    await expect(app.injectWS('/%77s/dashboard', { headers })).rejects.toThrow('401');
    expect(getAll).not.toHaveBeenCalled();
    const code = auth.newPairing();
    expect((await app.inject({ method: 'POST', url: '/api/pair', headers: { ...headers, origin: 'https://evil.example' }, payload: { code } })).statusCode).toBe(403);
    const paired = await app.inject({ method: 'POST', url: '/api/pair', headers, payload: { code } });
    expect(paired.statusCode).toBe(200);
    const { token } = paired.json();
    const authorized = { ...headers, authorization: `Bearer ${token}` };
    expect((await app.inject({ url: '/api/sessions', headers: authorized })).statusCode).toBe(200);
    expect((await app.inject({ url: '/mcp', headers: authorized })).statusCode).toBe(404);
    expect((await app.inject({ url: '/ws/extension', headers: authorized })).statusCode).toBe(404);
    const ws = await app.injectWS('/ws/dashboard', { headers: authorized });
    expect(getAll).toHaveBeenCalledTimes(2);
    ws.terminate();
    auth.revokeAll();
    expect((await app.inject({ url: '/api/sessions', headers: authorized })).statusCode).toBe(401);
  } finally { await app.close(); }
});
