/**
 * Session status enum.
 * @readonly
 * @enum {string}
 */
export const SESSION_STATUS = Object.freeze({
  REGISTERED: 'registered',
  WORKING: 'working',
  IDLE: 'idle',
  BLOCKED: 'blocked',
  NEEDS_INPUT: 'needs_input',
  DONE: 'done',
});

/**
 * @typedef {'registered'|'working'|'idle'|'blocked'|'needs_input'|'done'} SessionStatus
 */

/**
 * Creates a validated session event object.
 *
 * @param {SessionStatus} status
 * @param {string} sessionId
 * @param {string} [message]
 * @returns {import('./schema.js').SessionEvent}
 */
export function createSessionEvent(status, sessionId, message = '') {
  if (!Object.values(SESSION_STATUS).includes(status)) {
    throw new Error(`Invalid session status: "${status}"`);
  }
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('sessionId must be a non-empty string');
  }

  return {
    type: 'session_event',
    status,
    sessionId,
    message,
    ts: Date.now(),
  };
}

/**
 * Creates an alert notification object.
 *
 * @param {string} sessionId
 * @param {string} message
 * @param {string[]} [options]
 * @returns {import('./schema.js').AlertNotification}
 */
export function createAlertNotification(sessionId, message, options = []) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('sessionId must be a non-empty string');
  }
  if (!message || typeof message !== 'string') {
    throw new Error('message must be a non-empty string');
  }

  return {
    type: 'alert_notification',
    sessionId,
    message,
    options,
    ts: Date.now(),
  };
}
