/**
 * Sends a [TEST] user_prompt to the first registered session.
 * Watch VS Code — Copilot Chat should open with the prompt pre-filled.
 * Usage: node send-prompt.mjs [optional prompt text]
 */
import WebSocket from 'ws';

const prompt = process.argv[2] ?? '[TEST] Open Copilot Chat from mobile';

const sessions = await fetch('http://localhost:7337/api/sessions').then(r => r.json());
const session = sessions[0];
if (!session) {
  console.error('No sessions registered. Is VS Code connected?');
  process.exit(1);
}

console.log(`Sending user_prompt to: ${session.workspaceName} (${session.sessionId})`);
console.log(`Prompt: ${prompt}`);

const ws = new WebSocket('ws://localhost:7337/ws/dashboard');
ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'user_prompt', sessionId: session.sessionId, prompt, ts: Date.now() }));
  setTimeout(() => { ws.close(); process.exit(0); }, 500);
});
ws.on('error', e => { console.error(e.message); process.exit(1); });
