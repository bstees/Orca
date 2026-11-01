/**
 * End-to-end flow tester for the Orca WebSocket protocol.
 *
 * Simulates:
 *   1. VS Code extension connecting and registering a session
 *   2. Status update to needs_input
 *   3. Dashboard (mobile app) connecting and sending alert_response
 *   4. Extension side verifying the response is received via status broadcast
 *   5. Dashboard sending user_prompt and verifying the working status update
 *
 * Usage: node test-flow.mjs
 */

import WebSocket from 'ws';

const SERVER = 'ws://localhost:7337';
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

function connectWs(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Buffered message collector — captures messages from the moment it is created
// so none are missed while awaiting other promises.
function makeCollector(ws) {
  const queue = [];
  const waiters = [];
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (waiters.length > 0) {
      const { resolve, timer } = waiters.shift();
      clearTimeout(timer);
      resolve(msg);
    } else {
      queue.push(msg);
    }
  });
  return {
    next(timeoutMs = 3000) {
      if (queue.length > 0) return Promise.resolve(queue.shift());
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = waiters.findIndex((w) => w.resolve === resolve);
          if (idx !== -1) waiters.splice(idx, 1);
          reject(new Error('timeout waiting for message'));
        }, timeoutMs);
        waiters.push({ resolve, timer });
      });
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: alert_response flow
// ─────────────────────────────────────────────────────────────────────────────
async function testAlertResponseFlow() {
  console.log('\n── Test 1: alert_response flow ──');

  const ext = await connectWs(`${SERVER}/ws/extension`);
  const dash = await connectWs(`${SERVER}/ws/dashboard`);
  const extCol = makeCollector(ext);
  const dashCol = makeCollector(dash);

  // Dashboard gets sessions_snapshot on connect
  const snapshot = await dashCol.next();
  assert(snapshot.type === 'sessions_snapshot', 'dashboard receives sessions_snapshot on connect');

  // Extension registers a session
  ext.send(JSON.stringify({
    type: 'session_registered',
    workspaceName: 'FlowTest',
    gitBranch: 'test/alert-response',
    description: 'Testing alert_response flow',
    approvalMode: 'default',
    ts: Date.now(),
  }));

  const [ack, regBroadcast] = await Promise.all([extCol.next(), dashCol.next()]);
  assert(ack.type === 'session_ack', `extension receives session_ack`);
  assert(typeof ack.sessionId === 'string' && ack.sessionId.length > 0, `sessionId assigned: ${ack.sessionId}`);
  const sessionId = ack.sessionId;

  // Dashboard should receive session_registered broadcast
  assert(regBroadcast.type === 'session_registered', 'dashboard receives session_registered broadcast');
  assert(regBroadcast.session?.sessionId === sessionId, 'broadcast carries correct sessionId');

  // Extension sets status to needs_input
  ext.send(JSON.stringify({
    type: 'status_updated',
    sessionId,
    status: 'needs_input',
    message: '[TEST] Should I proceed with the refactor?',
    ts: Date.now(),
  }));

  const needsInputBroadcast = await dashCol.next();
  assert(needsInputBroadcast.type === 'status_updated', 'dashboard receives status_updated broadcast');
  assert(needsInputBroadcast.status === 'needs_input', 'status is needs_input');
  assert(needsInputBroadcast.message === '[TEST] Should I proceed with the refactor?', 'message forwarded correctly');

  // Dashboard (mobile) sends alert_response
  dash.send(JSON.stringify({
    type: 'alert_response',
    sessionId,
    option: 'Yes, proceed',
    ts: Date.now(),
  }));

  const respondedBroadcast = await dashCol.next();
  assert(respondedBroadcast.type === 'status_updated', 'dashboard receives responded status broadcast');
  assert(respondedBroadcast.status === 'responded', `status updated to responded (got: ${respondedBroadcast.status})`);
  assert(respondedBroadcast.message === 'Response: Yes, proceed', `response message set correctly (got: ${respondedBroadcast.message})`);
  assert(respondedBroadcast.sessionId === sessionId, 'correct sessionId in broadcast');

  // Verify via REST that response is stored
  const res = await fetch(`http://localhost:7337/api/sessions`);
  const sessions = await res.json();
  const session = sessions.find((s) => s.sessionId === sessionId);
  assert(session != null, 'session exists in REST API');
  assert(session?.status === 'responded', `REST API shows responded status (got: ${session?.status})`);

  ext.close();
  dash.close();
  await sleep(200);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: user_prompt flow
// ─────────────────────────────────────────────────────────────────────────────
async function testUserPromptFlow() {
  console.log('\n── Test 2: user_prompt flow ──');

  const ext = await connectWs(`${SERVER}/ws/extension`);
  const dash = await connectWs(`${SERVER}/ws/dashboard`);
  const extCol = makeCollector(ext);
  const dashCol = makeCollector(dash);

  // Drain snapshot
  await dashCol.next();

  // Register
  ext.send(JSON.stringify({
    type: 'session_registered',
    workspaceName: 'FlowTest-Prompt',
    gitBranch: 'test/user-prompt',
    description: 'Testing user_prompt flow',
    approvalMode: 'default',
    ts: Date.now(),
  }));

  const [ack] = await Promise.all([extCol.next(), dashCol.next()]);
  const sessionId = ack.sessionId;
  assert(typeof sessionId === 'string', `session registered: ${sessionId}`);

  // Dashboard sends user_prompt (mobile "Ask a task…" input)
  dash.send(JSON.stringify({
    type: 'user_prompt',
    sessionId,
    prompt: '[TEST] Refactor the authentication module',
    ts: Date.now(),
  }));

  // Server should broadcast status_updated with working + 📱 prefix
  const workingBroadcast = await dashCol.next();
  assert(workingBroadcast.type === 'status_updated', 'dashboard receives status_updated after user_prompt');
  assert(workingBroadcast.status === 'working', `status set to working (got: ${workingBroadcast.status})`);
  assert(
    workingBroadcast.message === '📱 [TEST] Refactor the authentication module',
    `message has 📱 prefix (got: ${workingBroadcast.message})`
  );

  ext.close();
  dash.close();
  await sleep(200);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: session_dismissed flow
// ─────────────────────────────────────────────────────────────────────────────
async function testSessionDismissedFlow() {
  console.log('\n── Test 3: session_dismissed flow ──');

  const ext = await connectWs(`${SERVER}/ws/extension`);
  const dash = await connectWs(`${SERVER}/ws/dashboard`);
  const extCol = makeCollector(ext);
  const dashCol = makeCollector(dash);

  await dashCol.next(); // drain snapshot

  ext.send(JSON.stringify({
    type: 'session_registered',
    workspaceName: 'FlowTest-Dismiss',
    gitBranch: 'test/dismiss',
    description: 'Testing session_dismissed flow',
    approvalMode: 'default',
    ts: Date.now(),
  }));

  const [ack] = await Promise.all([extCol.next(), dashCol.next()]);
  const sessionId = ack.sessionId;

  // Mark as done
  ext.send(JSON.stringify({ type: 'status_updated', sessionId, status: 'done', message: 'All done', ts: Date.now() }));
  await dashCol.next(); // drain status_updated

  // Dashboard dismisses
  dash.send(JSON.stringify({ type: 'session_dismissed', sessionId, ts: Date.now() }));

  const removedMsg = await dashCol.next();
  assert(removedMsg.type === 'session_removed', 'dashboard receives session_removed after dismiss');
  assert(removedMsg.sessionId === sessionId, 'correct sessionId in session_removed');

  // Verify removed from REST
  const res = await fetch('http://localhost:7337/api/sessions');
  const sessions = await res.json();
  const gone = !sessions.some((s) => s.sessionId === sessionId);
  assert(gone, 'session removed from registry');

  ext.close();
  dash.close();
  await sleep(200);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: set_approval_mode flow
// ─────────────────────────────────────────────────────────────────────────────
async function testSetApprovalModeFlow() {
  console.log('\n── Test 4: set_approval_mode flow ──');

  const ext = await connectWs(`${SERVER}/ws/extension`);
  const dash = await connectWs(`${SERVER}/ws/dashboard`);
  const extCol = makeCollector(ext);
  const dashCol = makeCollector(dash);

  await dashCol.next(); // drain snapshot

  ext.send(JSON.stringify({
    type: 'session_registered',
    workspaceName: 'FlowTest-Approval',
    gitBranch: 'test/approval',
    description: 'Testing set_approval_mode flow',
    approvalMode: 'default',
    ts: Date.now(),
  }));

  const [ack] = await Promise.all([extCol.next(), dashCol.next()]);
  const sessionId = ack.sessionId;

  // Dashboard changes approval mode to autopilot
  // Extension and dashboard receive concurrently — collect both at once
  dash.send(JSON.stringify({ type: 'set_approval_mode', sessionId, approvalMode: 'autopilot', ts: Date.now() }));

  const [extMsg, dashMsg] = await Promise.all([extCol.next(), dashCol.next()]);

  assert(extMsg.type === 'set_approval_mode', 'extension receives set_approval_mode message');
  assert(extMsg.approvalMode === 'autopilot', `approvalMode forwarded correctly (got: ${extMsg.approvalMode})`);

  assert(dashMsg.type === 'approval_mode_changed', 'dashboard receives approval_mode_changed broadcast');
  assert(dashMsg.approvalMode === 'autopilot', `approval mode is autopilot (got: ${dashMsg.approvalMode})`);
  assert(dashMsg.sessionId === sessionId, 'correct sessionId');

  ext.close();
  dash.close();
  await sleep(200);
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all tests
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log('Orca WebSocket flow tests');
  console.log('=========================');
  try {
    await testAlertResponseFlow();
    await testUserPromptFlow();
    await testSessionDismissedFlow();
    await testSetApprovalModeFlow();
  } catch (err) {
    console.error('\nFATAL:', err.message);
    failed++;
  }

  console.log(`\n=========================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
