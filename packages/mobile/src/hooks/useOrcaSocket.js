import { useState, useEffect, useCallback, useRef } from 'react';

const RECONNECT_DELAY_MS = 3000;

/**
 * Connects to the Orca dashboard WebSocket endpoint.
 * Reconnects automatically on disconnect.
 * React Native's global WebSocket is used (no import needed).
 *
 * @param {string} url - WebSocket URL (ws://... or wss://...)
 * @returns {{ connected: boolean, socketStatus: string, lastMessage: Object | null, send: (data: Object) => void }}
 */
export function useOrcaSocket(url) {
  const [connected, setConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    setSocketStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setSocketStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        setLastMessage(JSON.parse(event.data));
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setSocketStatus('disconnected');
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      // handled by onclose
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    connect();
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, socketStatus, lastMessage, send, reconnect };
}
