import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WifiHigh, WifiNone, WifiMedium } from 'phosphor-react-native';
import { useOrcaSocket } from './hooks/useOrcaSocket.js';
import { useSessions } from './hooks/useSessions.js';
import { useNotifications } from './hooks/useNotifications.js';
import { SessionsList } from './components/SessionsList.jsx';

// Point this at your Orca server. On a physical device, use your Mac's LAN IP.
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
  const socket = useOrcaSocket(ORCA_WS_URL);
  const { sessions } = useSessions(socket);
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

  const handleApprovalModeChange = useCallback((sessionId, approvalMode) => {
    socket.send({ type: 'set_approval_mode', sessionId, approvalMode });
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
      <SessionsList sessions={sessions} onRespond={handleRespond} onDismiss={handleDismiss} onPrompt={handlePrompt} onApprovalModeChange={handleApprovalModeChange} refreshing={refreshing} onRefresh={handleRefresh} />
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
