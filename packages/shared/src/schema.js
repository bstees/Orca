/**
 * JSDoc type definitions for the Orca shared protocol.
 * No runtime code — import types only.
 */

/**
 * @typedef {Object} SessionRegistration
 * @property {string} sessionId     - UUID assigned by the server
 * @property {string} workspaceName - Human-readable workspace name
 * @property {string} gitBranch     - Current git branch
 * @property {string} description   - Brief description of what this session is doing
 * @property {string|null} [approvalMode] - VS Code Copilot approval mode (`chat.permissions.default`)
 * @property {number} registeredAt  - Unix timestamp (ms)
 */

/**
 * @typedef {Object} SessionEvent
 * @property {'session_event'} type
 * @property {import('./events.js').SessionStatus} status
 * @property {string} sessionId
 * @property {string} message
 * @property {number} ts  - Unix timestamp (ms)
 */

/**
 * @typedef {Object} AlertNotification
 * @property {'alert_notification'} type
 * @property {string} sessionId
 * @property {string} message
 * @property {string[]} options  - Optional choices to present to the human
 * @property {number} ts         - Unix timestamp (ms)
 */

/**
 * @typedef {Object} WebSocketMessage
 * @property {string} type
 * @property {string} sessionId
 * @property {number} ts
 * @property {Object} [payload]
 */
