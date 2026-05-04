import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools.js';
import { registerResources } from './resources.js';

/**
 * Creates and configures the Orca MCP server.
 *
 * @param {import('../registry/sessions.js').SessionRegistry} registry
 * @param {import('../notifications/ntfy.js').NtfyNotifier} notifier
 * @returns {McpServer}
 */
export function createMcpServer(registry, notifier) {
  const server = new McpServer({
    name: 'orca',
    version: '0.1.0',
  });

  registerTools(server, registry, notifier);
  registerResources(server, registry);

  return server;
}
