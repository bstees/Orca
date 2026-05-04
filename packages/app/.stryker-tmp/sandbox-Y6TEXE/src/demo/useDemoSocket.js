/**
 * useDemoSocket — drop-in replacement for useOrcaSocket that replays
 * MOCK_WS_STREAM fixture events. Used when VITE_DEMO=true.
 *
 * The returned shape is identical to useOrcaSocket so components are unaware
 * of the substitution.
 */
// @ts-nocheck

import { useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_WS_STREAM } from '@orca/shared';

/**
 * @returns {{ connected: boolean, lastMessage: Object | null, send: () => void }}
 */
export function useDemoSocket() {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    // Small startup delay to simulate connection
    const connectTimer = setTimeout(() => setConnected(true), 200);

    // Schedule each stream event
    const eventTimers = MOCK_WS_STREAM.map(({ delayMs, payload }) =>
      setTimeout(() => setLastMessage(payload), 200 + delayMs)
    );

    timers.current = [connectTimer, ...eventTimers];

    return () => {
      for (const t of timers.current) clearTimeout(t);
    };
  }, []);

  // After the stream ends, loop back after a pause
  useEffect(() => {
    const lastDelay = MOCK_WS_STREAM[MOCK_WS_STREAM.length - 1]?.delayMs ?? 0;
    const loopTimer = setTimeout(() => {
      setLastMessage(null);
      // Re-mount effect by resetting state — simplest loop mechanism
      const restartTimer = setTimeout(() => {
        setLastMessage(MOCK_WS_STREAM[0].payload);
      }, 500);
      timers.current.push(restartTimer);
    }, 200 + lastDelay + 3000);

    timers.current.push(loopTimer);
    return () => clearTimeout(loopTimer);
  }, []);

  const send = useCallback(() => {
    // No-op in demo mode — nothing to send
  }, []);

  return { connected, lastMessage, send };
}
