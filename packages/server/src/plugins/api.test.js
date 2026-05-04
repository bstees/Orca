import Fastify from 'fastify';
import Database from 'better-sqlite3';
import { createSessionRegistry } from '../registry/sessions.js';
import { apiPlugin } from './api.js';
import { MOCK_SESSIONS, SESSION_STATUS } from '@orca/shared';

async function buildApp(registry) {
  const fastify = Fastify();
  await fastify.register(apiPlugin, { registry });
  await fastify.ready();
  return fastify;
}

describe('apiPlugin', () => {
  let db, registry, app;

  beforeEach(async () => {
    db = new Database(':memory:');
    registry = createSessionRegistry(db);
    app = await buildApp(registry);
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  describe('GET /api/health', () => {
    it('returns status ok', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/health' });
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('ok');
    });

    it('includes a ts timestamp', async () => {
      const before = Date.now();
      const res = await app.inject({ method: 'GET', url: '/api/health' });
      const after = Date.now();
      const { ts } = res.json();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  describe('GET /api/sessions', () => {
    it('returns empty array when no sessions', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/sessions' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('returns registered sessions', async () => {
      const { workspaceName, gitBranch, description } = MOCK_SESSIONS[0];
      registry.register({ workspaceName, gitBranch, description });

      const res = await app.inject({ method: 'GET', url: '/api/sessions' });
      const sessions = res.json();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].workspaceName).toBe(workspaceName);
      expect(sessions[0].status).toBe(SESSION_STATUS.REGISTERED);
    });

    it('returns multiple sessions most-recent first', async () => {
      for (const s of MOCK_SESSIONS.slice(0, 3)) {
        registry.register({ workspaceName: s.workspaceName, gitBranch: s.gitBranch, description: s.description });
      }

      const res = await app.inject({ method: 'GET', url: '/api/sessions' });
      const sessions = res.json();
      expect(sessions).toHaveLength(3);
      // most-recent first: each registeredAt <= next
      for (let i = 0; i < sessions.length - 1; i++) {
        expect(sessions[i].registeredAt).toBeGreaterThanOrEqual(sessions[i + 1].registeredAt);
      }
    });
  });
});
