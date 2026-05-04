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
    registered_at INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
`;

/**
 * Creates a session registry backed by SQLite.
 *
 * @param {Database.Database} db
 * @returns {SessionRegistry}
 */
export function createSessionRegistry(db) {
  db.exec(SCHEMA);

  const stmts = {
    insert: db.prepare(`
      INSERT INTO sessions (session_id, workspace_name, git_branch, description, status, message, registered_at, updated_at)
      VALUES (@sessionId, @workspaceName, @gitBranch, @description, @status, @message, @registeredAt, @updatedAt)
    `),
    update: db.prepare(`
      UPDATE sessions SET status = @status, message = @message, updated_at = @updatedAt
      WHERE session_id = @sessionId
    `),
    selectAll: db.prepare('SELECT * FROM sessions ORDER BY registered_at DESC'),
    selectOne: db.prepare('SELECT * FROM sessions WHERE session_id = ?'),
    delete: db.prepare('DELETE FROM sessions WHERE session_id = ?'),
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
      registeredAt: row.registered_at,
      updatedAt: row.updated_at,
    };
  }

  return {
    register({ workspaceName, gitBranch, description = '' }) {
      const now = Date.now();
      const sessionId = randomUUID();
      const session = {
        sessionId,
        workspaceName,
        gitBranch,
        description,
        status: SESSION_STATUS.REGISTERED,
        message: '',
        registeredAt: now,
        updatedAt: now,
      };
      stmts.insert.run({ ...session, registeredAt: now, updatedAt: now });
      cache.set(sessionId, session);
      return session;
    },

    updateStatus(sessionId, status, message = '') {
      const now = Date.now();
      stmts.update.run({ sessionId, status, message, updatedAt: now });
      const existing = cache.get(sessionId);
      if (existing) {
        cache.set(sessionId, { ...existing, status, message, updatedAt: now });
      }
    },

    getAll() {
      return Array.from(cache.values());
    },

    get(sessionId) {
      return cache.get(sessionId);
    },

    remove(sessionId) {
      stmts.delete.run(sessionId);
      cache.delete(sessionId);
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
