/**
 * Shared fixture data used by unit tests AND the app's demo/preview mode.
 *
 * All timestamps are offsets from a fixed epoch so tests are deterministic.
 * Call `hydrateSessions(Date.now())` to get sessions with real-world `ts` values.
 */

import { SESSION_STATUS } from './events.js';

/** Fixed epoch for snapshot-stable tests (2025-01-15 10:00:00 UTC) */
export const FIXTURE_EPOCH = 1736935200000;

/**
 * Raw session objects as they come out of the registry.
 * Timestamps are absolute values based on FIXTURE_EPOCH.
 * @type {import('./schema.js').SessionRegistration[]}
 */
export const MOCK_SESSIONS = [
  {
    sessionId: 'sess-alpha-001',
    workspaceName: 'orca',
    gitBranch: 'feat/dashboard',
    description: 'Building the real-time Orca dashboard and WebSocket bridge',
    status: SESSION_STATUS.WORKING,
    message: 'Writing SessionCard component',
    registeredAt: FIXTURE_EPOCH - 45 * 60 * 1000,        // 45 min ago
    updatedAt: FIXTURE_EPOCH - 2 * 60 * 1000,             // 2 min ago
  },
  {
    sessionId: 'sess-beta-002',
    workspaceName: 'api-service',
    gitBranch: 'fix/auth-tokens',
    description: 'Fixing JWT expiry bug in the auth middleware',
    status: SESSION_STATUS.NEEDS_INPUT,
    message: 'Should the token TTL be 15 min or 1 hour? Waiting for decision.',
    registeredAt: FIXTURE_EPOCH - 90 * 60 * 1000,        // 90 min ago
    updatedAt: FIXTURE_EPOCH - 5 * 60 * 1000,             // 5 min ago
  },
  {
    sessionId: 'sess-gamma-003',
    workspaceName: 'docs',
    gitBranch: 'docs/api-reference',
    description: 'Generating API reference from OpenAPI spec',
    status: SESSION_STATUS.IDLE,
    message: 'Waiting for build to finish',
    registeredAt: FIXTURE_EPOCH - 120 * 60 * 1000,       // 2 hr ago
    updatedAt: FIXTURE_EPOCH - 20 * 60 * 1000,            // 20 min ago
  },
  {
    sessionId: 'sess-delta-004',
    workspaceName: 'infra',
    gitBranch: 'chore/upgrade-k8s',
    description: 'Upgrading Kubernetes manifests to 1.30',
    status: SESSION_STATUS.BLOCKED,
    message: 'Helm chart missing required field — needs human review',
    registeredAt: FIXTURE_EPOCH - 200 * 60 * 1000,       // 3+ hr ago
    updatedAt: FIXTURE_EPOCH - 60 * 60 * 1000,            // 1 hr ago
  },
  {
    sessionId: 'sess-epsilon-005',
    workspaceName: 'orca',
    gitBranch: 'feat/mcp-server',
    description: 'Implementing MCP tools for session registration',
    status: SESSION_STATUS.DONE,
    message: 'All tools implemented and tested',
    registeredAt: FIXTURE_EPOCH - 300 * 60 * 1000,       // 5 hr ago
    updatedAt: FIXTURE_EPOCH - 180 * 60 * 1000,           // 3 hr ago
  },
];

/**
 * WebSocket messages replayed in the demo mode.
 * Represents a stream of live events from the server.
 * Message types match the server's websocket.js protocol:
 *   - sessions_snapshot: sent on dashboard connect
 *   - session_registered: new session (flat fields)
 *   - status_updated: session status change
 *   - session_deregistered: session removed
 *   - alert_notification: human input needed
 * @type {Array<{delayMs: number, payload: object}>}
 */
export const MOCK_WS_STREAM = [
  // Initial snapshot — server sends this on first connect
  {
    delayMs: 0,
    payload: {
      type: 'sessions_snapshot',
      sessions: MOCK_SESSIONS.filter((s) => s.status !== SESSION_STATUS.DONE),
      ts: FIXTURE_EPOCH,
    },
  },
  // alpha transitions to idle
  {
    delayMs: 3000,
    payload: {
      type: 'status_updated',
      sessionId: 'sess-alpha-001',
      status: SESSION_STATUS.IDLE,
      message: 'Waiting for test runner',
      ts: FIXTURE_EPOCH + 3000,
    },
  },
  // New session registers
  {
    delayMs: 5000,
    payload: {
      type: 'session_registered',
      sessionId: 'sess-zeta-006',
      workspaceName: 'payments',
      gitBranch: 'feat/stripe-webhooks',
      description: 'Adding Stripe webhook handler',
      ts: FIXTURE_EPOCH + 5000,
    },
  },
  // beta resolves its input request
  {
    delayMs: 8000,
    payload: {
      type: 'status_updated',
      sessionId: 'sess-beta-002',
      status: SESSION_STATUS.WORKING,
      message: 'Proceeding with 15 min TTL',
      ts: FIXTURE_EPOCH + 8000,
    },
  },
  // alpha back to working
  {
    delayMs: 10000,
    payload: {
      type: 'status_updated',
      sessionId: 'sess-alpha-001',
      status: SESSION_STATUS.WORKING,
      message: 'Tests passing, wiring up Storybook',
      ts: FIXTURE_EPOCH + 10000,
    },
  },
  // Alert: blocked session needs human
  {
    delayMs: 13000,
    payload: {
      type: 'alert_notification',
      sessionId: 'sess-delta-004',
      message: 'Helm upgrade is blocked — need you to review the diff and approve',
      options: ['Approve', 'Skip for now', 'Open PR'],
      ts: FIXTURE_EPOCH + 13000,
    },
  },
  // zeta transitions to working
  {
    delayMs: 15000,
    payload: {
      type: 'status_updated',
      sessionId: 'sess-zeta-006',
      status: SESSION_STATUS.WORKING,
      message: 'Parsing webhook payload',
      ts: FIXTURE_EPOCH + 15000,
    },
  },
];

/**
 * Returns MOCK_SESSIONS with timestamps adjusted so `updatedAt` offsets are
 * relative to `now` instead of FIXTURE_EPOCH. Useful for live UI previews.
 *
 * @param {number} [now] - current timestamp (default: Date.now())
 * @returns {import('./schema.js').SessionRegistration[]}
 */
export function hydrateSessions(now = Date.now()) {
  const delta = now - FIXTURE_EPOCH;
  return MOCK_SESSIONS.map((s) => ({
    ...s,
    registeredAt: s.registeredAt + delta,
    updatedAt: s.updatedAt + delta,
  }));
}
