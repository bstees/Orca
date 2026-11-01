'use strict';
const { WebSocket } = require('ws');

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

/**
 * @param {{ serverUrl: string }} opts
 */
function createOrcaClient({ serverUrl }) {
  const wsUrl = serverUrl.replace(/^http/, 'ws');
  const extensionUrl = `${wsUrl}/ws/extension`;

  let ws = null;
  let stopped = false;
  let backoffMs = INITIAL_BACKOFF_MS;
  let reconnectTimer = null;
  let queue = [];
  let statusHandler = null;
  let messageHandler = null;
  let connectHandler = null;
  let sessionId = null;

  function notifyStatus(connected) {
    statusHandler?.(connected);
  }

  function drain() {
    while (queue.length && ws?.readyState === WebSocket.OPEN) {
      ws.send(queue.shift());
    }
  }

  function connect() {
    ws = new WebSocket(extensionUrl);

    ws.on('open', () => {
      backoffMs = INITIAL_BACKOFF_MS;
      sessionId = null; // reset — will be re-assigned from session_ack
      notifyStatus(true);
      connectHandler?.();
      drain();
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'session_ack' && msg.sessionId) {
          sessionId = msg.sessionId;
        }
        messageHandler?.(msg);
      } catch {
        // ignore malformed
      }
    });

    ws.on('close', () => {
      notifyStatus(false);
      if (stopped) return;
      reconnectTimer = setTimeout(() => {
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        connect();
      }, backoffMs);
    });

    ws.on('error', () => {
      // handled by close
    });
  }

  return {
    connect() {
      connect();
    },

    disconnect() {
      stopped = true;
      clearTimeout(reconnectTimer);
      ws?.close();
      ws = null;
    },

    send(type, payload = {}) {
      const msg = JSON.stringify({ type, ...payload, ts: Date.now() });
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(msg);
      } else {
        queue.push(msg);
      }
    },

    getSessionId() {
      return sessionId;
    },

    onConnect(handler) {
      connectHandler = handler;
    },

    onStatusChange(handler) {
      statusHandler = handler;
    },

    onMessage(handler) {
      messageHandler = handler;
    },
  };
}

module.exports = { createOrcaClient };
