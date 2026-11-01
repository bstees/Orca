import Database from 'better-sqlite3';
import { createSessionRegistry } from '../registry/sessions.js';
import { SESSION_STATUS } from '@orca/shared';

function makeRegistry() {
  const db = new Database(':memory:');
  return createSessionRegistry(db);
}

describe('createSessionRegistry', () => {
  test('register returns a session with a UUID sessionId', () => {
    const registry = makeRegistry();
    const session = registry.register({ workspaceName: 'test-ws', gitBranch: 'main', description: 'desc' });
    expect(session.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(session.workspaceName).toBe('test-ws');
    expect(session.gitBranch).toBe('main');
    expect(session.status).toBe(SESSION_STATUS.REGISTERED);
  });

  test('getAll returns all registered sessions', () => {
    const registry = makeRegistry();
    registry.register({ workspaceName: 'ws-a', gitBranch: 'main' });
    registry.register({ workspaceName: 'ws-b', gitBranch: 'dev' });
    expect(registry.getAll()).toHaveLength(2);
  });

  test('get returns the session by id', () => {
    const registry = makeRegistry();
    const { sessionId } = registry.register({ workspaceName: 'ws', gitBranch: 'main' });
    const found = registry.get(sessionId);
    expect(found.sessionId).toBe(sessionId);
  });

  test('get returns undefined for unknown id', () => {
    const registry = makeRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  test('updateStatus changes status and message', () => {
    const registry = makeRegistry();
    const { sessionId } = registry.register({ workspaceName: 'ws', gitBranch: 'main' });
    registry.updateStatus(sessionId, SESSION_STATUS.WORKING, 'doing work');
    const session = registry.get(sessionId);
    expect(session.status).toBe(SESSION_STATUS.WORKING);
    expect(session.message).toBe('doing work');
  });

  test('remove deletes the session', () => {
    const registry = makeRegistry();
    const { sessionId } = registry.register({ workspaceName: 'ws', gitBranch: 'main' });
    registry.remove(sessionId);
    expect(registry.get(sessionId)).toBeUndefined();
    expect(registry.getAll()).toHaveLength(0);
  });

  test('clear removes all sessions', () => {
    const registry = makeRegistry();
    registry.register({ workspaceName: 'ws-a', gitBranch: 'main' });
    registry.register({ workspaceName: 'ws-b', gitBranch: 'dev' });
    registry.clear();
    expect(registry.getAll()).toHaveLength(0);
  });

  test('persists sessions across re-opens of the same db', () => {
    const db = new Database(':memory:');
    const r1 = createSessionRegistry(db);
    r1.register({ workspaceName: 'persisted-ws', gitBranch: 'main' });

    const r2 = createSessionRegistry(db);
    expect(r2.getAll().some((s) => s.workspaceName === 'persisted-ws')).toBe(true);
  });

  test('setPrompt stores a pending prompt in memory', () => {
    const registry = makeRegistry();
    const { sessionId } = registry.register({ workspaceName: 'ws', gitBranch: 'main' });
    registry.setPrompt(sessionId, 'Write unit tests for the auth module');
    expect(registry.get(sessionId).pendingPrompt).toBe('Write unit tests for the auth module');
  });

  test('clearPrompt removes the pending prompt', () => {
    const registry = makeRegistry();
    const { sessionId } = registry.register({ workspaceName: 'ws', gitBranch: 'main' });
    registry.setPrompt(sessionId, 'Do something');
    registry.clearPrompt(sessionId);
    expect(registry.get(sessionId).pendingPrompt).toBeNull();
  });

  test('setPrompt queues multiple prompts; clearPrompt dequeues FIFO', () => {
    const registry = makeRegistry();
    const { sessionId } = registry.register({ workspaceName: 'ws', gitBranch: 'main' });
    registry.setPrompt(sessionId, 'First prompt');
    registry.setPrompt(sessionId, 'Second prompt');
    expect(registry.get(sessionId).pendingPrompt).toBe('First prompt');
    registry.clearPrompt(sessionId);
    expect(registry.get(sessionId).pendingPrompt).toBe('Second prompt');
    registry.clearPrompt(sessionId);
    expect(registry.get(sessionId).pendingPrompt).toBeNull();
  });

  test('register stores approvalMode when provided', () => {
    const registry = makeRegistry();
    const session = registry.register({ workspaceName: 'ws', gitBranch: 'main', approvalMode: 'bypass' });
    expect(session.approvalMode).toBe('bypass');
    expect(registry.get(session.sessionId).approvalMode).toBe('bypass');
  });

  test('register defaults approvalMode to null when not provided', () => {
    const registry = makeRegistry();
    const session = registry.register({ workspaceName: 'ws', gitBranch: 'main' });
    expect(session.approvalMode).toBeNull();
  });

  test('updateApprovalMode changes approvalMode in cache and db', () => {
    const registry = makeRegistry();
    const { sessionId } = registry.register({ workspaceName: 'ws', gitBranch: 'main', approvalMode: 'default' });
    registry.updateApprovalMode(sessionId, 'autopilot');
    expect(registry.get(sessionId).approvalMode).toBe('autopilot');
  });

  test('updateApprovalMode emits approval_mode_changed event', () => {
    const EventEmitter = require('node:events');
    const db = require('better-sqlite3')(':memory:');
    const { createSessionRegistry } = require('../registry/sessions.js');
    const emitter = new EventEmitter();
    const registry = createSessionRegistry(db, emitter);
    const { sessionId } = registry.register({ workspaceName: 'ws', gitBranch: 'main' });
    const handler = jest.fn();
    emitter.on('approval_mode_changed', handler);
    registry.updateApprovalMode(sessionId, 'bypass');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ sessionId, approvalMode: 'bypass' }));
  });
});