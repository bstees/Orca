import './styles/base.css';
import { useOrcaSocket } from './hooks/useOrcaSocket.js';
import { useDemoSocket } from './demo/useDemoSocket.js';
import { useSessions } from './hooks/useSessions.js';
import { AlertBanner } from './components/AlertBanner/AlertBanner.jsx';
import { SessionsList } from './components/SessionsList/SessionsList.jsx';

const IS_DEMO = import.meta.env.VITE_DEMO === 'true';
const SOCKET_URL = import.meta.env.VITE_ORCA_WS_URL ?? 'ws://localhost:7337/ws/dashboard';

export default function App() {
  const socket = IS_DEMO ? useDemoSocket() : useOrcaSocket(SOCKET_URL);
  const { sessions, alerts } = useSessions(socket);

  return (
    <orc-app class="app">
      <header className="app__header">
        <h1 className="app__title">Orca {IS_DEMO && <span className="app__demo-badge">demo</span>}</h1>
        <span className="app__connection">{socket.connected ? '● Connected' : '○ Connecting…'}</span>
      </header>
      <main className="app__main">
        <AlertBanner alerts={alerts} sessions={sessions} />
        <SessionsList sessions={sessions} />
      </main>
    </orc-app>
  );
}

