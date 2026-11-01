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
    // Verify updatedAt is set to the message's ts
    expect(updated.updatedAt).toBe(statusUpdate.ts);
  });

  test('status_updated defaults message to empty string when absent', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    const targetId = statusUpdate.sessionId;

    act(() => { rerender({ msg: { ...statusUpdate, message: undefined } }); });

    const updated = result.current.sessions.find((s) => s.sessionId === targetId);
    expect(updated.message).toBe('');
  });

  test('status_updated falls back updatedAt to Date.now() when ts absent', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    const targetId = statusUpdate.sessionId;
    const before = Date.now();

    act(() => { rerender({ msg: { ...statusUpdate, ts: undefined } }); });
    const after = Date.now();

    const updated = result.current.sessions.find((s) => s.sessionId === targetId);
    expect(updated.updatedAt).toBeGreaterThanOrEqual(before);
    expect(updated.updatedAt).toBeLessThanOrEqual(after);
  });

  test('only the matching session is updated, not all sessions', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });

    const targetId = statusUpdate.sessionId;
    const otherBefore = result.current.sessions
      .filter((s) => s.sessionId !== targetId)
      .map((s) => s.status);

    act(() => { rerender({ msg: statusUpdate }); });

    const otherAfter = result.current.sessions
      .filter((s) => s.sessionId !== targetId)
      .map((s) => s.status);

    expect(otherAfter).toEqual(otherBefore);
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

  test('new session defaults message to empty string', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    const msg = { ...registration, message: undefined };
    act(() => { rerender({ msg }); });

    const newSession = result.current.sessions.find((s) => s.sessionId === registration.sessionId);
    expect(newSession.message).toBe('');
  });

  test('new session defaults description to empty string when not provided', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    const msg = { ...registration, description: undefined };
    act(() => { rerender({ msg }); });

    const newSession = result.current.sessions.find((s) => s.sessionId === registration.sessionId);
    expect(newSession.description).toBe('');
  });

  test('new session preserves provided description', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    const msg = { ...registration, description: 'My workspace desc' };
    act(() => { rerender({ msg }); });

    const newSession = result.current.sessions.find((s) => s.sessionId === registration.sessionId);
    expect(newSession.description).toBe('My workspace desc');
  });

  test('new session uses ts for registeredAt when provided', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    const ts = 1700000000000;
    const msg = { ...registration, ts };
    act(() => { rerender({ msg }); });

    const newSession = result.current.sessions.find((s) => s.sessionId === registration.sessionId);
    expect(newSession.registeredAt).toBe(ts);
    expect(newSession.updatedAt).toBe(ts);
  });

  test('new session falls back to Date.now() when ts is absent', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    const before = Date.now();
    const msg = { ...registration, ts: undefined };
    act(() => { rerender({ msg }); });
    const after = Date.now();

    const newSession = result.current.sessions.find((s) => s.sessionId === registration.sessionId);
    expect(newSession.registeredAt).toBeGreaterThanOrEqual(before);
    expect(newSession.registeredAt).toBeLessThanOrEqual(after);
  });

  test('does not duplicate an already-registered session', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    const before = result.current.sessions.length;

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

  test('non-alert messages do not add to alerts array', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    act(() => { rerender({ msg: statusUpdate }); });
    act(() => { rerender({ msg: registration }); });

    expect(result.current.alerts).toHaveLength(0);
  });

  test('unknown message type does not add to alerts array', () => {
    // All known types return early before reaching the alert_notification check.
    // An unrecognized type falls through all guards and must NOT create an alert.
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: { type: 'totally_unknown', sessionId: 'x' } }); });

    expect(result.current.alerts).toHaveLength(0);
  });

  test('alert_response marks session working with response text', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    act(() => { rerender({ msg: { type: 'alert_response', sessionId: statusUpdate.sessionId, option: 'Approve', ts: 1700000000000 } }); });

    const updated = result.current.sessions.find((s) => s.sessionId === statusUpdate.sessionId);
    expect(updated.status).toBe('working');
    expect(updated.message).toBe('Response: Approve');
    expect(updated.updatedAt).toBe(1700000000000);
  });

  test('approval_mode_changed updates only the target session approvalMode', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    act(() => { rerender({ msg: snapshot }); });
    const targetId = snapshot.sessions[0].sessionId;

    act(() => {
      rerender({ msg: { type: 'approval_mode_changed', sessionId: targetId, approvalMode: 'autopilot', ts: Date.now() } });
    });

    const updated = result.current.sessions.find((s) => s.sessionId === targetId);
    expect(updated.approvalMode).toBe('autopilot');

    // Other sessions unchanged
    result.current.sessions
      .filter((s) => s.sessionId !== targetId)
      .forEach((s) => expect(s.approvalMode).not.toBe('autopilot'));
  });
});
