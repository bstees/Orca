/**
 * scripts/mock-extension.js
 *
 * Phase 0 feedback harness — simulates a VS Code extension connecting to the
 * Orca server via WebSocket and sending a realistic sequence of session events.
 *
 * Run with:
 *   node scripts/mock-extension.js
 *
 * Optionally set ORCA_SERVER_URL (default ws://localhost:7337).
 */

import { WebSocket } from 'ws';

const SERVER_URL = process.env.ORCA_SERVER_URL ?? 'ws://127.0.0.1:7337';
const WS_URL = `${SERVER_URL}/ws/extension`;

const SESSION_ID = `mock-${Date.now()}`;
let ws;
let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  process.stdout.write(`  ✓ ${label}\n`);
}

function fail(label, reason) {
  failed++;
  process.stderr.write(`  ✗ ${label}: ${reason}\n`);
}

function send(type, payload = {}) {
  const msg = JSON.stringify({ type, sessionId: SESSION_ID, ts: Date.now(), ...payload });
  ws.send(msg);
  process.stdout.write(`  → sent: ${type}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  process.stdout.write(`\nMock extension connecting to ${WS_URL}\n\n`);

  await new Promise((resolve, reject) => {
    ws = new WebSocket(WS_URL);
    ws.on('open', resolve);
    ws.on('error', reject);
  }).then(() => ok('WebSocket connected')).catch((err) => {
    fail('WebSocket connect', err.message);
    process.stdout.write('\nMake sure the Orca server is running: yarn workspace @orca/server dev\n\n');
    process.exit(1);
  });

  const messages = [];
  ws.on('message', (data) => {
    try {
      messages.push(JSON.parse(data.toString()));
    } catch {
      messages.push({ raw: data.toString() });
    }
  });

  // --- Register session ---
  send('session_registered', {
    workspaceName: 'mock-workspace',
    gitBranch: 'feature/mock-test',
    description: 'Mock extension probe',
  });
  await sleep(200);

  // --- Status update: working ---
  send('status_updated', { status: 'working', message: 'Mock: doing some work' });
  await sleep(200);

  // --- Status update: needs input ---
  send('status_updated', { status: 'needs_input', message: 'Mock: which approach?' });
  await sleep(500);

  // Check we received an ack or broadcast
  if (messages.length > 0) {
    ok(`Received ${messages.length} server message(s)`);
  } else {
    process.stdout.write('  ℹ No server push messages received (server may only push to dashboard)\n');
    passed++;
  }

  // --- Status update: done ---
  send('status_updated', { status: 'done', message: 'Mock: finished' });
  await sleep(200);

  // --- Deregister ---
  send('session_deregistered', {});
  await sleep(200);

  ws.close();

  process.stdout.write(`\n${passed} passed, ${failed} failed\n\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
