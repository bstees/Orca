import { useState, useEffect } from 'react';
import './styles/base.css';
import { useOrcaSocket } from './hooks/useOrcaSocket.js';
import { useDemoSocket } from './demo/useDemoSocket.js';
import { useSessions } from './hooks/useSessions.js';
import { AlertBanner } from './components/AlertBanner/AlertBanner.jsx';
import { SessionsList } from './components/SessionsList/SessionsList.jsx';

const IS_DEMO = import.meta.env.VITE_DEMO === 'true';
const DEFAULT_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const HOST_WITH_BRACKETS = typeof window !== 'undefined' && DEFAULT_HOST.includes(':') ? `[${DEFAULT_HOST}]` : DEFAULT_HOST;
const SOCKET_URL = import.meta.env.VITE_ORCA_WS_URL ?? `ws://${HOST_WITH_BRACKETS}:7337/ws/dashboard`;

export default function App() {
  const [alertResponse, setAlertResponse] = useState(null);
  const [sessionResponses, setSessionResponses] = useState({});
  const socket = IS_DEMO ? useDemoSocket() : useOrcaSocket(SOCKET_URL);
  const { sessions, alerts } = useSessions(socket);

  useEffect(() => {
    if (!alerts[0] || alerts[0].sessionId !== alertResponse?.sessionId) {
      setAlertResponse(null);
    }
  }, [alerts, alertResponse]);

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

  const handleApprovalModeChange = (sessionId, approvalMode) => {
    if (!IS_DEMO) {
      socket.send({ type: 'set_approval_mode', sessionId, approvalMode, ts: Date.now() });
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
          onApprovalModeChange={handleApprovalModeChange}
          onDismiss={handleDismiss}
        />
      </main>
    </orc-app>
  );
}

