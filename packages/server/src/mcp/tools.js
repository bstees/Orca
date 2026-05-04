import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SESSION_STATUS } from '@orca/shared';

/**
 * Registers Orca MCP tools on the given McpServer instance.
 *
 * @param {McpServer} server
 * @param {import('../registry/sessions.js').SessionRegistry} registry
 * @param {import('../notifications/ntfy.js').NtfyNotifier} notifier
 */
export function registerTools(server, registry, notifier) {
  server.tool(
    'orca_register_session',
    'Register this AI session with Orca. Call once at the start of every session.',
    {
      workspaceName: z.string().min(1).describe('Human-readable workspace name'),
      gitBranch: z.string().min(1).describe('Current git branch'),
      description: z.string().describe('Brief description of what this session is doing'),
    },
    async ({ workspaceName, gitBranch, description }) => {
      const session = registry.register({ workspaceName, gitBranch, description });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ sessionId: session.sessionId }),
          },
        ],
      };
    }
  );

  server.tool(
    'orca_update_status',
    'Update the status of this AI session.',
    {
      sessionId: z.string().uuid().describe('Session ID returned by orca_register_session'),
      status: z.enum(Object.values(SESSION_STATUS)).describe('New session status'),
      message: z.string().describe('Human-readable summary of current state'),
    },
    async ({ sessionId, status, message }) => {
      registry.updateStatus(sessionId, status, message);
      return { content: [{ type: 'text', text: 'ok' }] };
    }
  );

  server.tool(
    'orca_request_input',
    'Signal that this session needs human input. Triggers a push notification and dashboard banner. Stop and wait after calling this.',
    {
      sessionId: z.string().uuid().describe('Session ID returned by orca_register_session'),
      message: z.string().min(1).describe('Question or decision needed from the human'),
      options: z.array(z.string()).optional().describe('Optional choices to present'),
    },
    async ({ sessionId, message, options = [] }) => {
      registry.updateStatus(sessionId, SESSION_STATUS.NEEDS_INPUT, message);

      const session = registry.get(sessionId);
      await notifier.post({
        title: `Input needed: ${session?.workspaceName ?? sessionId}`,
        message,
        tags: ['bell'],
        priority: 'high',
      });

      return { content: [{ type: 'text', text: 'Notification sent. Waiting for human response.' }] };
    }
  );
}
