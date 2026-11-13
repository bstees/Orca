import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../packages/server/src/config.js';
import { assertLocalHost, isLocalUrl, localRequestGuard } from '../packages/server/src/security.js';
import { createNtfyNotifier } from '../packages/server/src/notifications/ntfy.js';

test('default config is loopback with notifications disabled', () => {
  const config = loadConfig();
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.ntfy.topic, '');
  assert.equal(config.ntfy.token, '');
});
test('only loopback bind addresses are accepted', () => {
  for (const host of ['localhost', '127.0.0.1', '::1']) assert.doesNotThrow(() => assertLocalHost(host));
  for (const host of ['0.0.0.0', '::', '10.0.0.1', undefined]) assert.throws(() => assertLocalHost(host));
});
test('URL and request guard reject external sites and allow local clients', async () => {
  for (const value of ['null', 'https://evil.example', 'http://localhost.evil.example', 'file:///tmp/a']) assert.equal(isLocalUrl(value), false);
  const rejected = [];
  const reply = { code(status) { rejected.push(status); return this; }, send() {} };
  await localRequestGuard({ headers: { host: 'localhost:7337', origin: 'http://localhost:5173' } }, reply);
  assert.deepEqual(rejected, []);
  await localRequestGuard({ headers: { host: 'localhost:7337', origin: 'https://evil.example' } }, reply);
  await localRequestGuard({ headers: { host: 'evil.example' } }, reply);
  assert.deepEqual(rejected, [403, 403]);
});
test('notification opt-in, transport and authentication', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (...args) => { calls.push(args); return { ok: true, json: async () => ({ ok: true }) }; };
  try {
    for (const config of [{}, { topic: 'test' }, { token: 'test' }]) {
      assert.deepEqual(await createNtfyNotifier(config).post({ title: 'T', message: 'M' }), { skipped: true });
    }
    assert.equal(calls.length, 0);
    await assert.rejects(createNtfyNotifier({ baseUrl: 'http://example.com', topic: 'test', token: 'synthetic' }).post({}), /HTTPS/);
    await createNtfyNotifier({ baseUrl: 'https://example.com', topic: 'test', token: 'synthetic' }).post({ title: 'T', message: 'M' });
    assert.equal(calls[0][1].headers.Authorization, 'Bearer synthetic');
    assert.equal(calls[0][1].redirect, 'error');
  } finally { global.fetch = original; }
});
