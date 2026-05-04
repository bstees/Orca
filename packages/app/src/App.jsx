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
      <header class="app__header">
        <h1 class="app__title">Orca {IS_DEMO && <span class="app__demo-badge">demo</span>}</h1>
        <span class="app__connection">{socket.connected ? '● Connected' : '○ Connecting…'}</span>
      </header>
      <main class="app__main">
        <AlertBanner alerts={alerts} sessions={sessions} />
        <SessionsList sessions={sessions} />
      </main>
    </orc-app>
  );
}

