import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp, X, GitBranch } from 'phosphor-react-native';
import { APPROVAL_MODE_LABELS } from '@orca/shared';

function elapsedSince(sinceMs) {
  const ms = Date.now() - sinceMs;
  if (ms < 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const STATUS_CONFIG = {
  registered: { label: 'Registered', color: '#7a8fa6' },
  working:    { label: 'Working',    color: '#3ba3e0' },
  idle:       { label: 'Ready',      color: '#f59e0b' },
  blocked:    { label: 'Blocked',    color: '#f87171' },
  needs_input:{ label: 'Needs Input',color: '#60a5fa' },
  responded:  { label: 'Responded',  color: '#a78bfa' },
  done:       { label: 'Done',       color: '#34d399' },
};

function getStatus(status) {
  return STATUS_CONFIG[status] ?? { label: status, color: '#7a8fa6' };
}

export function SessionCard({ session, onRespond, onDismiss, onPrompt, onApprovalModeChange }) {
  const { sessionId, workspaceName, gitBranch, status, message, options = [], registeredAt, approvalMode } = session;
  const { label, color } = getStatus(status);
  const [freeText, setFreeText] = useState('');
  const [promptText, setPromptText] = useState('');
  const promptInputRef = useRef(null);
  const [elapsed, setElapsed] = useState(() => elapsedSince(registeredAt));
  const isNeedsInput = status === 'needs_input';
  const isDismissable = status === 'done' || status === 'responded';
  const isWorking = status === 'working';
  const showPromptInput = !isNeedsInput && !isDismissable;

  // Shimmer border animation for working state
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isWorking || process.env.NODE_ENV === 'test') {
      shimmerAnim.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2400, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [isWorking, shimmerAnim]);

  const shimmerRotate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Update the elapsed timer every 10 seconds
  useEffect(() => {
    const id = setInterval(() => setElapsed(elapsedSince(registeredAt)), 10_000);
    return () => clearInterval(id);
  }, [registeredAt]);

  function handleOption(option) {
    onRespond?.(sessionId, option);
  }

  function handleSubmitText() {
    const trimmed = freeText.trim();
    if (!trimmed) return;
    onRespond?.(sessionId, trimmed);
    setFreeText('');
  }

  function handleDismiss() {
    onDismiss?.(sessionId);
  }

  function handleSendPrompt() {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    onPrompt?.(sessionId, trimmed);
    setPromptText('');
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.workspace} numberOfLines={1}>{workspaceName}</Text>
        <View style={styles.headerRight}>
          {isWorking ? (
            <View style={styles.badgeShimmerOuter}>
              <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { transform: [{ scale: 6 }, { rotate: shimmerRotate }] }]}
              >
                <LinearGradient
                  colors={['#3ba3e0', '#60a5fa', '#a78bfa', '#7c3aed', '#3ba3e0']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
              </Animated.View>
              <View style={styles.badgeInner}>
                <Text style={[styles.badgeText, { color }]}>{label}</Text>
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.badge,
                { backgroundColor: color + '26', borderColor: color + '66' },
              ]}
            >
              <Text style={[styles.badgeText, { color }]}>{label}</Text>
            </View>
          )}
          {isDismissable && (
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={handleDismiss}
              accessibilityLabel="Dismiss session"
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <X size={14} color="#4b5563" weight="bold" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.branch}><GitBranch size={11} color="#7a8fa6" /> {gitBranch}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {isNeedsInput && options.length > 0 && (
        <View style={styles.optionRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.optionBtn}
              onPress={() => handleOption(opt)}
              accessibilityLabel={opt}
            >
              <Text style={styles.optionBtnText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {isNeedsInput && options.length === 0 && (
        <View style={styles.freeTextRow}>
          <TextInput
            style={styles.freeTextInput}
            value={freeText}
            onChangeText={setFreeText}
            onSubmitEditing={handleSubmitText}
            placeholder="Type a response…"
            placeholderTextColor="#4b5563"
            returnKeyType="send"
            accessibilityLabel="Response input"
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSubmitText}
            accessibilityLabel="Send response"
          >
            <ArrowUp size={16} color="#93c5fd" weight="bold" />
          </TouchableOpacity>
        </View>
      )}
      {showPromptInput && (
        <View style={styles.freeTextRow}>
          <TextInput
            ref={promptInputRef}
            style={styles.freeTextInput}
            value={promptText}
            onChangeText={setPromptText}
            onSubmitEditing={handleSendPrompt}
            placeholder="Ask a task…"
            placeholderTextColor="#4b5563"
            returnKeyType="send"
            accessibilityLabel="Prompt input"
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSendPrompt}
            accessibilityLabel="Send prompt"
          >
            <ArrowUp size={16} color="#93c5fd" weight="bold" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.approvalRow}>
        {Object.entries(APPROVAL_MODE_LABELS).map(([mode, modeLabel]) => {
          const active = (approvalMode ?? 'default') === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.approvalBtn, active && styles.approvalBtnActive]}
              onPress={() => onApprovalModeChange?.(sessionId, mode)}
              accessibilityLabel={modeLabel}
            >
              <Text style={[styles.approvalBtnText, active && styles.approvalBtnTextActive]}>{modeLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Text style={styles.elapsed}>{elapsed} ago</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111820',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginBottom: 10,
  },
  badgeShimmerOuter: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeInner: {
    borderRadius: 11,
    margin: 1,
    paddingHorizontal: 6.5,
    paddingVertical: 0.5,
    backgroundColor: '#111820',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workspace: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#e8ecf0',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  branch: {
    fontSize: 12,
    color: '#7a8fa6',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#e8ecf0',
    backgroundColor: '#161e28',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 8,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  optionBtnText: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '600',
  },
  freeTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  freeTextInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#161e28',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    color: '#e8ecf0',
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  approvalBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    backgroundColor: '#161e28',
  },
  approvalBtnActive: {
    borderColor: '#6366f1',
    backgroundColor: '#1e1f3a',
  },
  approvalBtnText: {
    fontSize: 10,
    color: '#4b5563',
    fontWeight: '500',
  },
  approvalBtnTextActive: {
    color: '#818cf8',
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  elapsed: {
    fontSize: 11,
    color: '#4b5563',
  },
});
