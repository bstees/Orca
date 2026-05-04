import { MOCK_SESSIONS, MOCK_WS_STREAM, FIXTURE_EPOCH, hydrateSessions, SESSION_STATUS } from './index.js';

describe('fixtures', () => {
  describe('MOCK_SESSIONS', () => {
    it('contains at least 4 sessions', () => {
      expect(MOCK_SESSIONS.length).toBeGreaterThanOrEqual(4);
    });

    it('each session has required fields', () => {
      for (const s of MOCK_SESSIONS) {
        expect(typeof s.sessionId).toBe('string');
        expect(s.sessionId.length).toBeGreaterThan(0);
        expect(typeof s.workspaceName).toBe('string');
        expect(typeof s.gitBranch).toBe('string');
        expect(Object.values(SESSION_STATUS)).toContain(s.status);
        expect(typeof s.registeredAt).toBe('number');
        expect(typeof s.updatedAt).toBe('number');
      }
    });

    it('covers all interesting statuses', () => {
      const statuses = new Set(MOCK_SESSIONS.map((s) => s.status));
      expect(statuses).toContain(SESSION_STATUS.WORKING);
      expect(statuses).toContain(SESSION_STATUS.NEEDS_INPUT);
      expect(statuses).toContain(SESSION_STATUS.BLOCKED);
      expect(statuses).toContain(SESSION_STATUS.DONE);
    });

    it('all sessionIds are unique', () => {
      const ids = MOCK_SESSIONS.map((s) => s.sessionId);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('MOCK_WS_STREAM', () => {
    it('first message is a sessions_snapshot', () => {
      expect(MOCK_WS_STREAM[0].payload.type).toBe('sessions_snapshot');
      expect(Array.isArray(MOCK_WS_STREAM[0].payload.sessions)).toBe(true);
    });

    it('delays are non-negative and sorted', () => {
      const delays = MOCK_WS_STREAM.map((m) => m.delayMs);
      expect(delays.every((d) => d >= 0)).toBe(true);
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
      }
    });

    it('status_updated messages reference known session IDs', () => {
      const knownIds = new Set(MOCK_WS_STREAM[0].payload.sessions.map((s) => s.sessionId));

      // Collect IDs registered mid-stream
      for (const { payload } of MOCK_WS_STREAM.slice(1)) {
        if (payload.type === 'session_registered') knownIds.add(payload.sessionId);
      }

      for (const { payload } of MOCK_WS_STREAM) {
        if (payload.type === 'status_updated' || payload.type === 'alert_notification') {
          expect(knownIds).toContain(payload.sessionId);
        }
      }
    });

    it('contains at least one alert_notification', () => {
      const hasAlert = MOCK_WS_STREAM.some((m) => m.payload.type === 'alert_notification');
      expect(hasAlert).toBe(true);
    });
  });

  describe('hydrateSessions', () => {
    it('shifts timestamps to be relative to now', () => {
      const now = Date.now();
      const sessions = hydrateSessions(now);
      const delta = now - FIXTURE_EPOCH;

      sessions.forEach((s, i) => {
        expect(s.registeredAt).toBe(MOCK_SESSIONS[i].registeredAt + delta);
        expect(s.updatedAt).toBe(MOCK_SESSIONS[i].updatedAt + delta);
      });
    });

    it('does not mutate MOCK_SESSIONS', () => {
      const before = MOCK_SESSIONS.map((s) => s.updatedAt);
      hydrateSessions(Date.now() + 99999);
      const after = MOCK_SESSIONS.map((s) => s.updatedAt);
      expect(after).toEqual(before);
    });

    it('defaults to current time', () => {
      const before = Date.now();
      const sessions = hydrateSessions();
      const after = Date.now();

      sessions.forEach((s, i) => {
        const expectedMin = MOCK_SESSIONS[i].registeredAt + (before - FIXTURE_EPOCH);
        const expectedMax = MOCK_SESSIONS[i].registeredAt + (after - FIXTURE_EPOCH);
        expect(s.registeredAt).toBeGreaterThanOrEqual(expectedMin);
        expect(s.registeredAt).toBeLessThanOrEqual(expectedMax);
      });
    });
  });
});
