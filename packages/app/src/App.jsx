import { useState, useEffect, useRef } from 'react';
import './styles/base.css';
import { useOrcaSocket } from './hooks/useOrcaSocket.js';
import { useDemoSocket } from './demo/useDemoSocket.js';
import { useSessions } from './hooks/useSessions.js';
import { AlertBanner } from './components/AlertBanner/AlertBanner.jsx';
import { SessionsList } from './components/SessionsList/SessionsList.jsx';

const IS_DEMO = import.meta.env.VITE_DEMO === 'true';
const DEFAULT_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const HOST_WITH_BRACKETS = typeof window !== 'undefined' && DEFAULT_HOST.includes(':') ? `[${DEFAULT_HOST}]` : DEFAULT_HOST;
const REMOTE = typeof window !== 'undefined' && window.location.protocol === 'https:';
const SOCKET_URL = REMOTE ? `wss://${window.location.host}/ws/dashboard`
  : (import.meta.env.VITE_ORCA_WS_URL ?? `ws://${HOST_WITH_BRACKETS}:7337/ws/dashboard`);

export default function App() {
  const pairRequest = useRef(0);
  useEffect(() => () => { pairRequest.current++; }, []);
  const [token, setToken] = useState(null);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingError, setPairingError] = useState('');
  const [pairingBusy, setPairingBusy] = useState(false);
  const [alertResponse, setAlertResponse] = useState(null);
  const [sessionResponses, setSessionResponses] = useState({});
  const socket = IS_DEMO ? useDemoSocket() : useOrcaSocket(SOCKET_URL, { token, enabled: !REMOTE || !!token });
  const sessionState = useSessions(socket);
  const { sessions, alerts } = REMOTE && !socket.connected ? { sessions: [], alerts: [] } : sessionState;

  useEffect(() => {
    if (!alerts[0] || alerts[0].sessionId !== alertResponse?.sessionId) {
      setAlertResponse(null);
    }
  }, [alerts, alertResponse]);

  const pair = async (event) => {
    event.preventDefault();
    if (pairingBusy) return;
    const requestId = ++pairRequest.current;
    setPairingBusy(true); setPairingError('');
    try {
      const response = await fetch('/api/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pairingCode.trim() }) });
      if (!response.ok) throw new Error('Pairing failed. Generate a fresh code locally.');
      const result = await response.json();
      if (!/^[\w-]{43}$/.test(result.token)) throw new Error('Invalid pairing response');
      if (requestId !== pairRequest.current) return;
      setToken(result.token); setPairingCode('');
    } catch { if (requestId === pairRequest.current) setPairingError('Pairing failed. Check the connection and generate a fresh code locally.'); }
    finally { if (requestId === pairRequest.current) setPairingBusy(false); }
  };

  const handleAlertOption = (sessionId, option) => {
    setAlertResponse({ sessionId, option });
    if (!IS_DEMO) {
      socket.send({
        type: 'alert_response',
        sessionId,
        option,
        ts: Date.now(),
      });
    }
  };

  const handleSessionAction = (sessionId, option) => {
    setSessionResponses((prev) => ({ ...prev, [sessionId]: option }));
    if (!IS_DEMO) {
      socket.send({
        type: 'alert_response',
        sessionId,
        option,
        ts: Date.now(),
      });
    }
  };

  const handleSessionSend = (sessionId, text) => {
    if (!text) return;
    setSessionResponses((prev) => ({ ...prev, [sessionId]: text }));
    if (!IS_DEMO) {
      socket.send({
        type: 'alert_response',
        sessionId,
        option: text,
        ts: Date.now(),
      });
    }
  };

  const handleDismiss = (sessionId) => {
    if (!IS_DEMO) {
      socket.send({ type: 'session_dismissed', sessionId, ts: Date.now() });
    }
  };

  return (
    <orc-app className="app">
      <header className="app__header">
        <h1 className="app__title">Orca {IS_DEMO && <span className="app__demo-badge">demo</span>}</h1>
        <span className={`app__connection app__connection--${socket.socketStatus ?? (socket.connected ? 'connected' : 'connecting')}`}>
          <span className="app__connection-dot" />
          {socket.socketStatus === 'connected' ? 'Connected' : socket.socketStatus === 'disconnected' ? 'Disconnected' : 'Connecting…'}
        </span>
      </header>
      <main className="app__main">
        {REMOTE && <section aria-label="Device pairing">
          <p>Secure remote dashboard. Pairing grants control of sessions, not editor permissions.</p>
          {(!token || socket.socketStatus === 'pairing' || socket.socketStatus === 'disconnected') && <form onSubmit={pair}>
            <label>One-time pairing code <input type="password" autoComplete="off" value={pairingCode} onChange={(event) => setPairingCode(event.target.value)} /></label>
            <button type="submit" disabled={pairingBusy}>Pair device</button>
            <p role="status">{pairingError}</p>
          </form>}
          {token && <button type="button" onClick={() => { pairRequest.current++; setPairingBusy(false); setToken(null); setPairingCode(''); }}>Forget this session</button>}
        </section>}

        <AlertBanner
          alerts={alerts}
          sessions={sessions}
          selectedOption={alertResponse?.option}
          onOptionSelect={handleAlertOption}
        />
        <SessionsList
          sessions={sessions}
          sessionResponses={sessionResponses}
          onSessionAction={handleSessionAction}
          onSessionSend={handleSessionSend}
          onDismiss={handleDismiss}
        />
      </main>
    </orc-app>
  );
}

