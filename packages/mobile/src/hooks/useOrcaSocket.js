import { useState, useEffect, useCallback, useRef } from 'react';
const RECONNECT_DELAY_MS = 3000;

export function useOrcaSocket(url, { token = null, enabled = true } = {}) {
  const [connected, setConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [lastMessage, setLastMessage] = useState(null);
  const [generation, setGeneration] = useState(0);
  const wsRef = useRef(null);
  useEffect(() => {
    let disposed = false;
    let timer;
    let current;
    setConnected(false);
    setLastMessage(null);
    if (!enabled) { setSocketStatus('pairing'); return; }
    if (token && !url.startsWith('wss://')) { setSocketStatus('pairing'); return; }
    function connect() {
      if (disposed) return;
      setSocketStatus('connecting');
      let opened = false;
      const ws = token ? new WebSocket(url, ['orca', `orca-auth.${token}`]) : new WebSocket(url);
      current = ws;
      wsRef.current = ws;
      ws.addEventListener('open', () => {
        if (disposed || current !== ws) return;
        opened = true;
        setConnected(true); setSocketStatus('connected');
      });
      ws.addEventListener('message', (event) => {
        if (disposed || current !== ws) return;
        try { setLastMessage(JSON.parse(event.data)); } catch { /* malformed message */ }
      });
      ws.addEventListener('close', (event) => {
        if (disposed || current !== ws) return;
        setConnected(false);
        setSocketStatus(event.code === 4001 ? 'pairing' : 'disconnected');
        if (opened && event.code !== 4001 && event.code !== 4008) timer = setTimeout(connect, RECONNECT_DELAY_MS);
      });
      ws.addEventListener('error', () => { /* close handles status; no credential retry loop */ });
    }
    connect();
    return () => { disposed = true; clearTimeout(timer); current?.close(); wsRef.current = null; };
  }, [url, token, enabled, generation]);
  const reconnect = useCallback(() => setGeneration((value) => value + 1), []);
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(data));
  }, []);
  return { connected, socketStatus, lastMessage, send, reconnect };
}
