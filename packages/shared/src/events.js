/**
 * VS Code Copilot approval mode enum.
 * Maps to the `chat.permissions.default` VS Code setting.
 * @readonly
 * @enum {string}
 */
export const APPROVAL_MODES = Object.freeze({
  DEFAULT: 'default',
  BYPASS: 'bypass',
  AUTOPILOT: 'autopilot',
});

/**
 * Human-readable labels for each approval mode.
 * @type {Record<string, string>}
 */
export const APPROVAL_MODE_LABELS = Object.freeze({
  default: 'Default Approvals',
  bypass: 'Bypass Approvals',
  autopilot: 'Autopilot',
});

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
  RESPONDED: 'responded',
  DONE: 'done',
});

/**
 * @typedef {'registered'|'working'|'idle'|'blocked'|'needs_input'|'responded'|'done'} SessionStatus
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
