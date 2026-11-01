import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { SESSION_STATUS } from '@orca/shared';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS sessions (
    session_id    TEXT PRIMARY KEY,
    workspace_name TEXT NOT NULL,
    git_branch    TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'registered',
    message       TEXT NOT NULL DEFAULT '',
    options       TEXT NOT NULL DEFAULT '[]',
    response      TEXT DEFAULT NULL,
    registered_at INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
`;

const MIGRATE_OPTIONS = `
  ALTER TABLE sessions ADD COLUMN options TEXT NOT NULL DEFAULT '[]'
`;

const MIGRATE_RESPONSE = `
  ALTER TABLE sessions ADD COLUMN response TEXT DEFAULT NULL
`;

const MIGRATE_APPROVAL_MODE = `
  ALTER TABLE sessions ADD COLUMN approval_mode TEXT DEFAULT NULL
`;

/**
 * Creates a session registry backed by SQLite.
 *
 * @param {Database.Database} db
 * @param {import('node:events').EventEmitter} [events]
 * @returns {SessionRegistry}
 */
export function createSessionRegistry(db, events = null) {
  db.exec(SCHEMA);
  // Add options column to existing databases (no-op if already present)
  try { db.exec(MIGRATE_OPTIONS); } catch { /* column already exists */ }
  try { db.exec(MIGRATE_RESPONSE); } catch { /* column already exists */ }
  try { db.exec(MIGRATE_APPROVAL_MODE); } catch { /* column already exists */ }

  const stmts = {
    insert: db.prepare(`
      INSERT INTO sessions (session_id, workspace_name, git_branch, description, status, message, options, approval_mode, registered_at, updated_at)
      VALUES (@sessionId, @workspaceName, @gitBranch, @description, @status, @message, @options, @approvalMode, @registeredAt, @updatedAt)
    `),
    update: db.prepare(`
      UPDATE sessions SET status = @status, message = @message, updated_at = @updatedAt
      WHERE session_id = @sessionId
    `),
    updateWithOptions: db.prepare(`
      UPDATE sessions SET status = @status, message = @message, options = @options, updated_at = @updatedAt
      WHERE session_id = @sessionId
    `),
    selectAll: db.prepare('SELECT * FROM sessions ORDER BY registered_at DESC'),
    selectOne: db.prepare('SELECT * FROM sessions WHERE session_id = ?'),
    delete: db.prepare('DELETE FROM sessions WHERE session_id = ?'),
    setResponse: db.prepare('UPDATE sessions SET response = @response, updated_at = @updatedAt WHERE session_id = @sessionId'),
    updateApprovalMode: db.prepare('UPDATE sessions SET approval_mode = @approvalMode, updated_at = @updatedAt WHERE session_id = @sessionId'),
  };

  // In-memory cache — primary read path
  const cache = new Map();

  // Replay persisted sessions on startup
  for (const row of stmts.selectAll.all()) {
    cache.set(row.session_id, rowToSession(row));
  }

  function rowToSession(row) {
    return {
      sessionId: row.session_id,
      workspaceName: row.workspace_name,
      gitBranch: row.git_branch,
      description: row.description,
      status: row.status,
      message: row.message,
      options: JSON.parse(row.options ?? '[]'),
      response: row.response ?? null,
      pendingPrompt: null,
      registeredAt: row.registered_at,
      updatedAt: row.updated_at,
      approvalMode: row.approval_mode ?? null,
    };
  }

  return {
    register({ workspaceName, gitBranch, description = '', approvalMode = null }) {
      const now = Date.now();
      const sessionId = randomUUID();
      const session = {
        sessionId,
        workspaceName,
        gitBranch,
        description,
        status: SESSION_STATUS.REGISTERED,
        message: '',
        options: [],
        response: null,
        pendingPrompt: null,
        pendingPrompts: [],
        approvalMode,
        registeredAt: now,
        updatedAt: now,
      };
      stmts.insert.run({ ...session, options: '[]', approvalMode, registeredAt: now, updatedAt: now });
      cache.set(sessionId, session);
      events?.emit('session_registered', session);
      return session;
    },

    updateStatus(sessionId, status, message = '', options = null) {
      const now = Date.now();
      if (options !== null) {
        stmts.updateWithOptions.run({ sessionId, status, message, options: JSON.stringify(options), updatedAt: now });
        const existing = cache.get(sessionId);
        if (existing) {
          const updated = { ...existing, status, message, options, updatedAt: now };
          cache.set(sessionId, updated);
          events?.emit('status_updated', updated);
        }
      } else {
        stmts.update.run({ sessionId, status, message, updatedAt: now });
        const existing = cache.get(sessionId);
        if (existing) {
          const updated = { ...existing, status, message, updatedAt: now };
          cache.set(sessionId, updated);
          events?.emit('status_updated', updated);
        }
      }
    },

    getAll() {
      return Array.from(cache.values());
    },

    get(sessionId) {
      return cache.get(sessionId);
    },

    setResponse(sessionId, response) {
      const now = Date.now();
      stmts.setResponse.run({ sessionId, response, updatedAt: now });
      const existing = cache.get(sessionId);
      if (existing) {
        cache.set(sessionId, { ...existing, response, updatedAt: now });
      }
    },

    updateApprovalMode(sessionId, approvalMode) {
      const now = Date.now();
      stmts.updateApprovalMode.run({ sessionId, approvalMode, updatedAt: now });
      const existing = cache.get(sessionId);
      if (existing) {
        const updated = { ...existing, approvalMode, updatedAt: now };
        cache.set(sessionId, updated);
        events?.emit('approval_mode_changed', updated);
      }
    },

    setPrompt(sessionId, prompt) {
      const existing = cache.get(sessionId);
      if (existing) {
        const queue = [...(existing.pendingPrompts ?? []), prompt];
        cache.set(sessionId, { ...existing, pendingPrompt: queue[0], pendingPrompts: queue });
      }
    },

    clearPrompt(sessionId) {
      const existing = cache.get(sessionId);
      if (existing) {
        const queue = (existing.pendingPrompts ?? []).slice(1);
        cache.set(sessionId, { ...existing, pendingPrompt: queue[0] ?? null, pendingPrompts: queue });
      }
    },

    remove(sessionId) {
      stmts.delete.run(sessionId);
      cache.delete(sessionId);
      events?.emit('session_removed', { sessionId });
    },

    clear() {
      db.prepare('DELETE FROM sessions').run();
      cache.clear();
    },
  };
}

/**
 * @typedef {Object} SessionRegistry
 * @property {(opts: { workspaceName: string, gitBranch: string, description?: string }) => import('@orca/shared').SessionRegistration} register
 * @property {(sessionId: string, status: string, message?: string) => void} updateStatus
 * @property {() => import('@orca/shared').SessionRegistration[]} getAll
 * @property {(sessionId: string) => import('@orca/shared').SessionRegistration | undefined} get
 * @property {(sessionId: string) => void} remove
 */
