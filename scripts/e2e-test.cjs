'use strict';
const { WebSocket } = require('ws');

const results = [];
const pass = (msg) => { results.push('✅ ' + msg); console.log('✅', msg); };
const fail = (msg) => { results.push('❌ ' + msg); console.error('❌', msg); };
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function nextMsg(ws, pred) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout waiting for message')), 700);
    const h = (d) => {
      const m = JSON.parse(d);
      if (!pred || pred(m)) {
        clearTimeout(t);
        ws.off('message', h);
        res(m);
      }
    };
    ws.on('message', h);
  });
}

async function run() {
  // ── Extension connects and registers ──
  const ext = new WebSocket('ws://localhost:7337/ws/extension');
  await new Promise(r => ext.on('open', r));
  ext.send(JSON.stringify({ type: 'session_registered', workspaceName: 'MyProject', gitBranch: 'feature/test', approvalMode: 'default' }));
  const ack = await nextMsg(ext, m => m.type === 'session_ack');
  const sessionId = ack.sessionId;
  pass('Extension registered, id=' + sessionId.slice(0, 8));

  // ── Mobile (dashboard) connects, receives snapshot ──
  const mob = new WebSocket('ws://localhost:7337/ws/dashboard');
  await new Promise(r => mob.on('open', r));
  const snap = await nextMsg(mob, m => m.type === 'sessions_snapshot');
  const s = snap.sessions.find(x => x.sessionId === sessionId);
  if (s && s.approvalMode === 'default') pass('Snapshot has session with approvalMode=default');
  else fail('Snapshot approvalMode wrong: ' + JSON.stringify(s && s.approvalMode));

  // ── Mobile sends user_prompt ──
  mob.send(JSON.stringify({ type: 'user_prompt', sessionId, prompt: 'add unit tests' }));
  const statusUpd = await nextMsg(mob, m => m.type === 'status_updated' && m.sessionId === sessionId).catch(() => null);
  if (statusUpd && statusUpd.message === '\uD83D\uDCF1 add unit tests') pass('user_prompt → status_updated(📱 add unit tests)');
  else fail('user_prompt status msg wrong: ' + JSON.stringify(statusUpd));

  // ── Extension sends status_updated → mobile sees it ──
  const extStatusProm = nextMsg(mob, m => m.type === 'status_updated' && m.status === 'working' && m.sessionId === sessionId);
  ext.send(JSON.stringify({ type: 'status_updated', sessionId, status: 'working', message: 'Running tests' }));
  const extStatus = await extStatusProm.catch(() => null);
  if (extStatus && extStatus.message === 'Running tests') pass('Extension status_updated broadcast → mobile sees it');
  else fail('Extension status not received by mobile: ' + JSON.stringify(extStatus));

  // ── Mobile changes approval mode ──
  const approvalBcast = nextMsg(mob, m => m.type === 'approval_mode_changed' && m.sessionId === sessionId);
  const extApproval = nextMsg(ext, m => m.type === 'set_approval_mode');
  mob.send(JSON.stringify({ type: 'set_approval_mode', sessionId, approvalMode: 'autopilot' }));
  const ab = await approvalBcast.catch(() => null);
  const ea = await extApproval.catch(() => null);
  if (ab && ab.approvalMode === 'autopilot') pass('approval_mode_changed broadcast received by mobile');
  else fail('approval_mode_changed not received: ' + JSON.stringify(ab));
  if (ea && ea.approvalMode === 'autopilot') pass('set_approval_mode forwarded to extension socket');
  else fail('extension did not receive set_approval_mode: ' + JSON.stringify(ea));

  // ── Verify DB state after approval mode change ──
  await wait(100);
  const http = require('http');
  const dbCheck = await new Promise((res) => {
    http.get('http://localhost:7337/api/sessions', (resp) => {
      let data = '';
      resp.on('data', d => { data += d; });
      resp.on('end', () => res(JSON.parse(data)));
    });
  });
  const dbSession = dbCheck.find ? dbCheck.find(x => x.sessionId === sessionId) : null;
  if (dbSession && dbSession.approvalMode === 'autopilot') pass('DB persisted approvalMode=autopilot');
  else fail('DB approvalMode wrong: ' + JSON.stringify(dbSession && dbSession.approvalMode));

  ext.close(); mob.close();

  console.log('\n── Summary ──');
  results.forEach(r => console.log(r));
  const failed = results.filter(r => r.startsWith('❌'));
  if (failed.length === 0) console.log('\nAll checks passed.');
  else process.exit(1);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
