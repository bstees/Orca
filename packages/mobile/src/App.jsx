import { useCallback, useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WifiHigh, WifiNone, WifiMedium } from 'phosphor-react-native';
import { useOrcaSocket } from './hooks/useOrcaSocket.js';
import { useSessions } from './hooks/useSessions.js';
import { useNotifications } from './hooks/useNotifications.js';
import { SessionsList } from './components/SessionsList.jsx';

// Remote devices require a trusted HTTPS certificate and one-time pairing.
// On iOS Simulator, localhost works fine.
const ORCA_WS_URL = process.env.EXPO_PUBLIC_ORCA_WS_URL ?? 'ws://localhost:7337/ws/dashboard';

const STATUS_LABEL = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
};

const STATUS_ICON = {
  connected: { Icon: WifiHigh, color: '#34d399' },
  disconnected: { Icon: WifiNone, color: '#f87171' },
  connecting: { Icon: WifiMedium, color: '#f59e0b' },
};

export default function App() {
  const remote = ORCA_WS_URL.startsWith('wss://');
  const pairRequest = useRef(0);
  useEffect(() => () => { pairRequest.current++; }, []);
  const [token, setToken] = useState(null);
  const [code, setCode] = useState('');
  const [pairError, setPairError] = useState('');
  const [pairingBusy, setPairingBusy] = useState(false);
  const safeLocal = /^ws:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(ORCA_WS_URL);
  const socket = useOrcaSocket(ORCA_WS_URL, { token, enabled: remote ? !!token : safeLocal });
  const pair = async () => {
    if (pairingBusy) return;
    const requestId = ++pairRequest.current;
    setPairingBusy(true); setPairError('');
    try {
      const origin = ORCA_WS_URL.replace(/^wss:/, 'https:').replace(/\/ws\/dashboard$/, '');
      const response = await fetch(`${origin}/api/pair`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim() }) });
      if (!response.ok) throw new Error('Pairing failed');
      const result = await response.json();
      if (!/^[\w-]{43}$/.test(result.token)) throw new Error('Invalid pairing response');
      if (requestId !== pairRequest.current) return;
      setToken(result.token); setCode('');
    } catch { if (requestId === pairRequest.current) setPairError('Pairing failed. Check TLS and generate a fresh local code.'); }
    finally { if (requestId === pairRequest.current) setPairingBusy(false); }
  };
  const sessionState = useSessions(socket);
  const sessions = remote && !socket.connected ? [] : sessionState.sessions;
  useNotifications({ lastMessage: socket.lastMessage, send: socket.send });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    socket.reconnect();
  }, [socket.reconnect]);
  useEffect(() => {
    if (socket.connected) setRefreshing(false);
  }, [socket.connected]);

  const handleRespond = useCallback((sessionId, option) => {
    socket.send({ type: 'alert_response', sessionId, option });
  }, [socket.send]);

  const handleDismiss = useCallback((sessionId) => {
    socket.send({ type: 'session_dismissed', sessionId });
  }, [socket.send]);

  const handlePrompt = useCallback((sessionId, prompt) => {
    socket.send({ type: 'user_prompt', sessionId, prompt });
  }, [socket.send]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Orca</Text>
        {(() => {
          const { Icon, color } = STATUS_ICON[socket.socketStatus] ?? STATUS_ICON.connecting;
          return <Icon size={16} color={color} weight="bold" />;
        })()}
        <Text style={styles.connectionLabel}>
          {STATUS_LABEL[socket.socketStatus] ?? 'Connecting…'}
        </Text>
      </View>
      {remote && <View>
        <Text style={{ color: 'white' }}>Pairing grants session control, not editor permissions.</Text>
        <TextInput accessibilityLabel="One-time pairing code" secureTextEntry value={code} onChangeText={setCode} autoCapitalize="none" style={{ color: 'white' }} />
        <Button title="Pair device" onPress={pair} disabled={pairingBusy} />
        <Text style={{ color: 'white' }}>{pairError}</Text>
        {token && <Button title="Forget this session" onPress={() => { pairRequest.current++; setPairingBusy(false); setToken(null); setCode(''); }} />}
      </View>}
      {!remote && !safeLocal && <Text>Remote access requires a wss:// address.</Text>}
      <SessionsList sessions={sessions} onRespond={handleRespond} onDismiss={handleDismiss} onPrompt={handlePrompt} refreshing={refreshing} onRefresh={handleRefresh} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f11',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#e8ecf0',
    letterSpacing: 0.5,
  },
  connectionLabel: {
    fontSize: 12,
    color: '#7a8fa6',
  },
});
