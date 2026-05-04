import Database from 'better-sqlite3';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createSessionRegistry } from '../registry/sessions.js';
import { registerTools } from './tools.js';
import { SESSION_STATUS, MOCK_SESSIONS } from '@orca/shared';

/** Build a wired-up MCP server+client pair over in-memory transport */
async function buildMcpPair(registry, notifier) {
  const server = new McpServer({ name: 'orca-test', version: '0.1.0' });
  registerTools(server, registry, notifier);

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
});
