import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import https from 'node:https';
import WebSocket from 'ws';
import { createRemoteApp } from '../packages/server/src/remote.js';

test('real TLS pairing and WSS revocation with trusted synthetic certificate', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'orca-remote-'));
  const keyPath = join(dir, 'key.pem'), certPath = join(dir, 'cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath, '-out', certPath, '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'], { stdio: 'ignore' });
  const { app, auth } = await createRemoteApp({ config: { origin: 'https://localhost', keyPath, certPath }, registry: { getAll: () => [] } });
  let ws;
  try {
    await app.listen({ port: 0, host: '127.0.0.1' });
    const port = app.server.address().port;
    const ca = readFileSync(certPath);
    const request = (path, payload) => new Promise((resolve, reject) => {
      const req = https.request({ host: '127.0.0.1', servername: 'localhost', port, ca, path, method: payload ? 'POST' : 'GET', headers: { host: 'localhost', 'content-type': 'application/json' } }, (res) => {
        let body = ''; res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject); req.end(payload ? JSON.stringify(payload) : undefined);
    });
    assert.equal((await request('/%61pi/sessions')).status, 401);
    assert.equal((await request('/')).status, 200);
    const paired = await request('/api/pair', { code: auth.newPairing() });
    assert.equal(paired.status, 200);
    const { token } = JSON.parse(paired.body);
    ws = new WebSocket(`wss://127.0.0.1:${port}/ws/dashboard`, ['orca', `orca-auth.${token}`], { ca, servername: 'localhost', headers: { host: 'localhost', origin: 'https://localhost' } });
    const snapshot = await new Promise((resolve, reject) => { ws.once('message', resolve); ws.once('error', reject); });
    assert.equal(JSON.parse(snapshot.toString()).type, 'sessions_snapshot');
    assert.equal(ws.protocol, 'orca');
    const closed = new Promise((resolve) => ws.once('close', resolve));
    auth.revokeAll();
    assert.equal(await closed, 4001);
  } finally { ws?.terminate(); await app.close(); rmSync(dir, { recursive: true, force: true }); }
});
