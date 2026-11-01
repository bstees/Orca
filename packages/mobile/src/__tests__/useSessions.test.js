import { renderHook, act } from '@testing-library/react-native';
import { useSessions } from '../hooks/useSessions.js';

const snapshot = {
  type: 'sessions_snapshot',
  sessions: [
    {
      sessionId: 'sess-001',
      workspaceName: 'Orca',
      gitBranch: 'main',
      description: 'Test session',
      status: 'working',
      message: 'Doing work',
      options: [],
      registeredAt: 1000,
      updatedAt: 1000,
    },
    {
      sessionId: 'sess-002',
      workspaceName: 'Other',
      gitBranch: 'feat/x',
      description: '',
      status: 'idle',
      message: '',
      options: [],
      registeredAt: 900,
      updatedAt: 900,
    },
  ],
  ts: 1000,
};

describe('useSessions', () => {
  it('starts with empty sessions', () => {
    const { result } = renderHook(() => useSessions({ lastMessage: null }));
    expect(result.current.sessions).toEqual([]);
  });

  it('populates sessions from sessions_snapshot', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });
    act(() => { rerender({ msg: snapshot }); });
    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.sessions[0].sessionId).toBe('sess-001');
  });

  it('updates status on status_updated', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });
    act(() => { rerender({ msg: snapshot }); });
    act(() => {
      rerender({
        msg: { type: 'status_updated', sessionId: 'sess-001', status: 'idle', message: 'Waiting', ts: 2000 },
      });
    });
    const updated = result.current.sessions.find((s) => s.sessionId === 'sess-001');
    expect(updated.status).toBe('idle');
    expect(updated.message).toBe('Waiting');
    expect(updated.updatedAt).toBe(2000);
  });

  it('removes session on session_removed', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });
    act(() => { rerender({ msg: snapshot }); });
    act(() => {
      rerender({ msg: { type: 'session_removed', sessionId: 'sess-001', ts: 2000 } });
    });
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].sessionId).toBe('sess-002');
  });

  it('removes session on session_deregistered', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });
    act(() => { rerender({ msg: snapshot }); });
    act(() => {
      rerender({ msg: { type: 'session_deregistered', sessionId: 'sess-002', ts: 2000 } });
    });
    expect(result.current.sessions).toHaveLength(1);
  });

  it('adds new session on session_registered', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });
    act(() => { rerender({ msg: snapshot }); });
    act(() => {
      rerender({
        msg: {
          type: 'session_registered',
          session: {
            sessionId: 'sess-003',
            workspaceName: 'New',
            gitBranch: 'feat/new',
            description: '',
            options: [],
            registeredAt: 3000,
            updatedAt: 3000,
          },
          ts: 3000,
        },
      });
    });
    expect(result.current.sessions).toHaveLength(3);
    expect(result.current.sessions[0].sessionId).toBe('sess-003');
  });

  it('does not duplicate on repeated session_registered', () => {
    const { result, rerender } = renderHook(({ msg }) => useSessions({ lastMessage: msg }), {
      initialProps: { msg: null },
    });
    act(() => { rerender({ msg: snapshot }); });
    const reg = {
      type: 'session_registered',
      session: { sessionId: 'sess-001', workspaceName: 'Orca', gitBranch: 'main', description: '', options: [] },
      ts: 5000,
    };
    act(() => { rerender({ msg: reg }); });
    expect(result.current.sessions).toHaveLength(2);
  });
});
