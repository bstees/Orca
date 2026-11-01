import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SessionCard } from './SessionCard.jsx';

export function SessionsList({ sessions, onRespond, onDismiss, onPrompt, onApprovalModeChange, refreshing, onRefresh }) {
  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.sessionId}
      renderItem={({ item }) => <SessionCard session={item} onRespond={onRespond} onDismiss={onDismiss} onPrompt={onPrompt} onApprovalModeChange={onApprovalModeChange} />}
      contentContainerStyle={sessions.length ? styles.list : styles.emptyList}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active sessions</Text>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyList: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#4b5563',
    fontSize: 14,
  },
});
