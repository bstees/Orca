import Database from 'better-sqlite3';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { EventEmitter } from 'node:events';
import { createSessionRegistry } from '../registry/sessions.js';
import { registerTools } from './tools.js';
import { SESSION_STATUS, MOCK_SESSIONS } from '@orca/shared';

/** Build a wired-up MCP server+client pair over in-memory transport */
async function buildMcpPair(registry, notifier, events) {
  const server = new McpServer({ name: 'orca-test', version: '0.1.0' });
  registerTools(server, registry, notifier, events);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  const client = new Client({ name: 'test-client', version: '0.1.0' });
  await client.connect(clientTransport);

  return { client, server };
}

describe('MCP tools', () => {
  let db, registry, notifier;

  beforeEach(() => {
    db = new Database(':memory:');
    registry = createSessionRegistry(db);
    notifier = { post: jest.fn().mockResolvedValue(undefined) };
  });

  afterEach(() => {
    db.close();
  });

  describe('orca_register_session', () => {
    it('returns a sessionId', async () => {
      const { client } = await buildMcpPair(registry, notifier);
      const result = await client.callTool({
        name: 'orca_register_session',
        arguments: {
          workspaceName: MOCK_SESSIONS[0].workspaceName,
          gitBranch: MOCK_SESSIONS[0].gitBranch,
          description: MOCK_SESSIONS[0].description,
        },
      });

      const body = JSON.parse(result.content[0].text);
      expect(typeof body.sessionId).toBe('string');
      expect(body.sessionId.length).toBeGreaterThan(0);
    });

    it('persists session in registry', async () => {
      const { client } = await buildMcpPair(registry, notifier);
      const result = await client.callTool({
        name: 'orca_register_session',
        arguments: {
          workspaceName: 'my-workspace',
          gitBranch: 'main',
          description: 'test session',
        },
      });

      const { sessionId } = JSON.parse(result.content[0].text);
      const session = registry.get(sessionId);
      expect(session).toBeDefined();
      expect(session.workspaceName).toBe('my-workspace');
      expect(session.status).toBe(SESSION_STATUS.REGISTERED);
    });
  });

  describe('orca_update_status', () => {
    it('updates registry status', async () => {
      const { client } = await buildMcpPair(registry, notifier);

      // Register first
      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      // Update status
      await client.callTool({
        name: 'orca_update_status',
        arguments: { sessionId, status: SESSION_STATUS.WORKING, message: 'on it' },
      });

      expect(registry.get(sessionId).status).toBe(SESSION_STATUS.WORKING);
      expect(registry.get(sessionId).message).toBe('on it');
    });

    it('returns ok', async () => {
      const { client } = await buildMcpPair(registry, notifier);
      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      const result = await client.callTool({
        name: 'orca_update_status',
        arguments: { sessionId, status: SESSION_STATUS.IDLE, message: '' },
      });

      expect(result.content[0].text).toBe('ok');
    });
  });

  describe('orca_request_input', () => {
    it('sets status to needs_input and calls notifier', async () => {
      const { client } = await buildMcpPair(registry, notifier);
      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      await client.callTool({
        name: 'orca_request_input',
        arguments: { sessionId, message: 'Which approach do you prefer?', options: ['A', 'B'] },
      });

      expect(registry.get(sessionId).status).toBe(SESSION_STATUS.NEEDS_INPUT);
      expect(notifier.post).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Which approach do you prefer?',
          priority: 'high',
        }),
      );
    });

    it('returns a waiting message', async () => {
      const { client } = await buildMcpPair(registry, notifier);
      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      const result = await client.callTool({
        name: 'orca_request_input',
        arguments: { sessionId, message: 'Help?' },
      });

      expect(result.content[0].text).toContain('Waiting');
    });
  });

  describe('orca_wait_for_response', () => {
    it('returns immediately if session already has responded status', async () => {
      const events = new EventEmitter();
      const registryWithEvents = createSessionRegistry(db, events);
      const { client } = await buildMcpPair(registryWithEvents, notifier, events);

      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      // Simulate human having already responded
      registryWithEvents.setResponse(sessionId, 'pre-answered');
      registryWithEvents.updateStatus(sessionId, SESSION_STATUS.RESPONDED, 'Response: pre-answered', []);

      const result = await client.callTool({
        name: 'orca_wait_for_response',
        arguments: { sessionId },
      });
      const body = JSON.parse(result.content[0].text);
      expect(body.response).toBe('pre-answered');
    });

    it('resolves when status_updated event fires with responded', async () => {
      const events = new EventEmitter();
      const registryWithEvents = createSessionRegistry(db, events);
      const { client } = await buildMcpPair(registryWithEvents, notifier, events);

      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      // Start waiting — don't await yet
      const waitPromise = client.callTool({
        name: 'orca_wait_for_response',
        arguments: { sessionId, timeoutMs: 5000 },
      });

      // Yield so the tool's event listeners are registered before we fire
      await new Promise(r => setImmediate(r));

      // Simulate dashboard button click (setResponse + updateStatus)
      registryWithEvents.setResponse(sessionId, 'React Native');
      registryWithEvents.updateStatus(sessionId, SESSION_STATUS.RESPONDED, 'Response: React Native', []);

      const result = await waitPromise;
      const body = JSON.parse(result.content[0].text);
      expect(body.response).toBe('React Native');
    });

    it('resolves with dismissed:true when session is removed', async () => {
      const events = new EventEmitter();
      const registryWithEvents = createSessionRegistry(db, events);
      const { client } = await buildMcpPair(registryWithEvents, notifier, events);

      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      const waitPromise = client.callTool({
        name: 'orca_wait_for_response',
        arguments: { sessionId, timeoutMs: 5000 },
      });

      // Yield so the tool's event listeners are registered before we fire
      await new Promise(r => setImmediate(r));

      registryWithEvents.remove(sessionId);

      const result = await waitPromise;
      const body = JSON.parse(result.content[0].text);
      expect(body.response).toBeNull();
      expect(body.dismissed).toBe(true);
    });

    it('resolves with timedOut:true after timeoutMs elapses', async () => {
      const events = new EventEmitter();
      const registryWithEvents = createSessionRegistry(db, events);
      const { client } = await buildMcpPair(registryWithEvents, notifier, events);

      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      const result = await client.callTool({
        name: 'orca_wait_for_response',
        arguments: { sessionId, timeoutMs: 50 },
      });
      const body = JSON.parse(result.content[0].text);
      expect(body.response).toBeNull();
      expect(body.timedOut).toBe(true);
    });

    it('self-heals on timeout: returns response if registry has one by then', async () => {
      const events = new EventEmitter();
      const registryWithEvents = createSessionRegistry(db, events);
      const { client } = await buildMcpPair(registryWithEvents, notifier, events);

      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      // Write response to registry without firing the event (simulates missed event)
      registryWithEvents.setResponse(sessionId, 'sneaky answer');

      const result = await client.callTool({
        name: 'orca_wait_for_response',
        arguments: { sessionId, timeoutMs: 50 },
      });
      const body = JSON.parse(result.content[0].text);
      expect(body.response).toBe('sneaky answer');
      expect(body.timedOut).toBeUndefined();
    });

    it('returns session_not_found error for unknown sessionId', async () => {
      const events = new EventEmitter();
      const registryWithEvents = createSessionRegistry(db, events);
      const { client } = await buildMcpPair(registryWithEvents, notifier, events);

      const result = await client.callTool({
        name: 'orca_wait_for_response',
        arguments: { sessionId: '00000000-0000-4000-8000-000000000000' },
      });
      const body = JSON.parse(result.content[0].text);
      expect(body.error).toBe('session_not_found');
    });
  });

  describe('orca_check_prompt', () => {
    it('returns null when no prompt is pending', async () => {
      const { client } = await buildMcpPair(registry, notifier);
      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      const result = await client.callTool({ name: 'orca_check_prompt', arguments: { sessionId } });
      const body = JSON.parse(result.content[0].text);
      expect(body.prompt).toBeNull();
    });

    it('returns and clears a pending prompt', async () => {
      const { client } = await buildMcpPair(registry, notifier);
      const regResult = await client.callTool({
        name: 'orca_register_session',
        arguments: { workspaceName: 'ws', gitBranch: 'main', description: '' },
      });
      const { sessionId } = JSON.parse(regResult.content[0].text);

      registry.setPrompt(sessionId, 'Add tests for the login flow');

      const result = await client.callTool({ name: 'orca_check_prompt', arguments: { sessionId } });
      const body = JSON.parse(result.content[0].text);
      expect(body.prompt).toBe('Add tests for the login flow');
      expect(registry.get(sessionId).status).toBe(SESSION_STATUS.WORKING);

      // Second call should return null — prompt was consumed
      const result2 = await client.callTool({ name: 'orca_check_prompt', arguments: { sessionId } });
      const body2 = JSON.parse(result2.content[0].text);
      expect(body2.prompt).toBeNull();
    });
  });
});
