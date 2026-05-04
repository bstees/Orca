// @ts-nocheck
import { renderHook, act } from '@testing-library/react';
import { useSessions } from './useSessions.js';
import { MOCK_SESSIONS, MOCK_WS_STREAM, SESSION_STATUS } from '@orca/shared';

const snapshot = MOCK_WS_STREAM.find((m) => m.payload.type === 'sessions_snapshot').payload;
const statusUpdate = MOCK_WS_STREAM.find((m) => m.payload.type === 'status_updated').payload;
const registration = MOCK_WS_STREAM.find((m) => m.payload.type === 'session_registered').payload;
const alertMsg = MOCK_WS_STREAM.find((m) => m.payload.type === 'alert_notification').payload;

describe('useSessions', () => {
  test('starts with empty sessions and alerts', () => {
    const { result } = renderHook(() => useSessions({ lastMessage: null }));
    expect(result.current.sessions).toEqual([]);
    expect(result.current.alerts).toEqual([]);
  });

  test('populates sessions from sessions_snapshot', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });

    expect(result.current.sessions).toHaveLength(snapshot.sessions.length);
    expect(result.current.sessions[0].sessionId).toBe(snapshot.sessions[0].sessionId);
  });

  test('updates session status on status_updated', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    act(() => { rerender({ msg: statusUpdate }); });

    const updated = result.current.sessions.find((s) => s.sessionId === statusUpdate.sessionId);
    expect(updated.status).toBe(statusUpdate.status);
    expect(updated.message).toBe(statusUpdate.message);
  });

  test('adds new session on session_registered', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    const before = result.current.sessions.length;

    act(() => { rerender({ msg: registration }); });

    expect(result.current.sessions).toHaveLength(before + 1);
    const newSession = result.current.sessions.find((s) => s.sessionId === registration.sessionId);
    expect(newSession.workspaceName).toBe(registration.workspaceName);
    expect(newSession.status).toBe(SESSION_STATUS.REGISTERED);
  });

  test('does not duplicate an already-registered session', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    const before = result.current.sessions.length;

    // Try to register a session that is already in the snapshot
    const duplicate = { ...registration, sessionId: snapshot.sessions[0].sessionId };
    act(() => { rerender({ msg: duplicate }); });

    expect(result.current.sessions).toHaveLength(before);
  });

  test('removes session on session_deregistered', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    const targetId = snapshot.sessions[0].sessionId;
    const before = result.current.sessions.length;

    act(() => { rerender({ msg: { type: 'session_deregistered', sessionId: targetId } }); });

    expect(result.current.sessions).toHaveLength(before - 1);
    expect(result.current.sessions.find((s) => s.sessionId === targetId)).toBeUndefined();
  });

  test('appends alert notifications to alerts array', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: alertMsg }); });

    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0].message).toBe(alertMsg.message);
  });

  test('most recent alert is first', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    const alert2 = { ...alertMsg, message: 'Second alert', sessionId: MOCK_SESSIONS[1].sessionId };

    act(() => { rerender({ msg: alertMsg }); });
    act(() => { rerender({ msg: alert2 }); });

    expect(result.current.alerts[0].message).toBe('Second alert');
    expect(result.current.alerts[1].message).toBe(alertMsg.message);
  });
});
