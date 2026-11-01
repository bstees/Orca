import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:7337/ws/extension');
let sessionId = null;

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'session_registered',
    workspaceName: 'Orca (Sim Test)',
    gitBranch: 'main',
    description: 'Testing iOS simulator UI',
    approvalMode: 'autopilot',
    ts: Date.now()
  }));
  console.log('sent session_registered');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('← server:', JSON.stringify(msg));
  if (msg.type === 'session_ack') {
    sessionId = msg.sessionId;
    console.log('got sessionId:', sessionId);

    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'status_updated',
        sessionId,
        status: 'needs_input',
        message: '[TEST] Should I refactor the button layout?',
        ts: Date.now()
      }));
      console.log('updated to needs_input');
    }, 2000);
  }
});

ws.on('error', e => { console.error(e.message); process.exit(1); });
setTimeout(() => { console.log('session timeout, closing'); process.exit(0); }, 300000);
