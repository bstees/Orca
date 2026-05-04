import { SESSION_STATUS, createSessionEvent, createAlertNotification } from './events.js';

describe('SESSION_STATUS', () => {
  test('is frozen', () => {
    expect(Object.isFrozen(SESSION_STATUS)).toBe(true);
  });

  test.each([
    'registered',
    'working',
    'idle',
    'blocked',
    'needs_input',
    'done',
  ])('contains status "%s"', (status) => {
    expect(Object.values(SESSION_STATUS)).toContain(status);
  });
});

describe('createSessionEvent', () => {
  test('creates a valid event with all fields', () => {
    const event = createSessionEvent(SESSION_STATUS.WORKING, 'abc-123', 'doing stuff');
    expect(event).toMatchObject({
      type: 'session_event',
      status: 'working',
      sessionId: 'abc-123',
      message: 'doing stuff',
    });
    expect(typeof event.ts).toBe('number');
    expect(event.ts).toBeGreaterThan(0);
  });

  test('defaults message to empty string', () => {
    const event = createSessionEvent(SESSION_STATUS.IDLE, 'abc-123');
    expect(event.message).toBe('');
  });

  test.each([
    ['working', 'abc-123', 'doing stuff'],
    ['idle', 'xyz-789', ''],
    ['done', 'done-session', 'finished'],
    ['needs_input', 'blocked-session', 'please decide'],
  ])('creates event for status=%s', (status, sessionId, message) => {
    const event = createSessionEvent(status, sessionId, message);
    expect(event.status).toBe(status);
    expect(event.sessionId).toBe(sessionId);
  });

  test('throws for invalid status', () => {
    expect(() => createSessionEvent('flying', 'abc-123')).toThrow('Invalid session status: "flying"');
  });

  test('throws for empty sessionId', () => {
    expect(() => createSessionEvent(SESSION_STATUS.WORKING, '')).toThrow('sessionId must be a non-empty string');
  });

  test('throws for non-string sessionId', () => {
    expect(() => createSessionEvent(SESSION_STATUS.WORKING, 42)).toThrow('sessionId must be a non-empty string');
  });
});

describe('createAlertNotification', () => {
  test('creates a valid notification', () => {
    const alert = createAlertNotification('sess-1', 'Which approach?', [
      'Option A',
      'Option B',
    ]);
    expect(alert).toMatchObject({
      type: 'alert_notification',
      sessionId: 'sess-1',
      message: 'Which approach?',
      options: [
        'Option A',
        'Option B',
      ],
    });
    expect(typeof alert.ts).toBe('number');
  });

  test('defaults options to empty array', () => {
    const alert = createAlertNotification('sess-1', 'Heads up');
    expect(alert.options).toEqual([]);
  });

  test('throws for empty sessionId', () => {
    expect(() => createAlertNotification('', 'msg')).toThrow('sessionId must be a non-empty string');
  });

  test('throws for non-string sessionId', () => {
    expect(() => createAlertNotification(42, 'msg')).toThrow('sessionId must be a non-empty string');
  });

  test('throws for empty message', () => {
    expect(() => createAlertNotification('sess-1', '')).toThrow('message must be a non-empty string');
  });

  test('throws for non-string message', () => {
    expect(() => createAlertNotification('sess-1', null)).toThrow('message must be a non-empty string');
  });

  test('throws for object message', () => {
    expect(() => createAlertNotification('sess-1', { text: 'hi' })).toThrow('message must be a non-empty string');
  });
});
