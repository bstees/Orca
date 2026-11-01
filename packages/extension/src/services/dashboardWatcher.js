'use strict';
const { WebSocket } = require('ws');

const RECONNECT_DELAY_MS = 5000;

/**
 * Connects to the Orca dashboard WebSocket and watches for:
 * - `needs_input` events on the extension's own session → calls onNeedsInput
 * - `needs_input` events where the message starts with "📱" on ANY session
 *   → calls onMobilePrompt(promptText) so the extension can open VS Code chat
 *
 * @param {{
 *   serverUrl: string,
 *   getSessionId: () => string | null,
 *   onNeedsInput: (message: string, options: string[]) => void,
 *   onMobilePrompt?: (prompt: string) => void,
 * }} opts
 */
function createDashboardWatcher({ serverUrl, getSessionId, onNeedsInput, onMobilePrompt }) {
  const wsUrl = serverUrl.replace(/^http/, 'ws');
  const dashboardUrl = `${wsUrl}/ws/dashboard`;

  let ws = null;
  let stopped = false;
  let reconnectTimer = null;

  function connect() {
    ws = new WebSocket(dashboardUrl);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type !== 'status_updated') return;

        const message = msg.message ?? '';
        const sessionId = getSessionId();

        if (msg.status === 'needs_input') {
          // Own session needs_input (AI asking a question)
          if (sessionId && msg.sessionId === sessionId) {
            onNeedsInput(message, msg.options ?? []);
          }
        } else if (msg.status === 'working' && message.startsWith('📱') && onMobilePrompt) {
          // Mobile prompt: only open Chat in the window that owns this session
          if (sessionId && msg.sessionId === sessionId) {
            const prompt = message.replace(/^📱\s*/, '');
            onMobilePrompt(prompt);
          }
        }
      } catch {
        // ignore malformed
      }
    });

    ws.on('close', () => {
      if (stopped) return;
      reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
    });

    ws.on('error', () => {
      // handled by close
    });
  }

  return {
    start() {
      connect();
    },

    stop() {
      stopped = true;
      clearTimeout(reconnectTimer);
      ws?.close();
      ws = null;
    },
  };
}

module.exports = { createDashboardWatcher };
