import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SESSION_STATUS } from '@orca/shared';

/**
 * Registers Orca MCP tools on the given McpServer instance.
 *
 * @param {McpServer} server
 * @param {import('../registry/sessions.js').SessionRegistry} registry
 * @param {import('../notifications/ntfy.js').NtfyNotifier} notifier
 * @param {import('node:events').EventEmitter} [events]
 */
export function registerTools(server, registry, notifier, events) {
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

      const session = registry.get(sessionId);
      const workspace = session?.workspaceName ?? sessionId;

      if (status === SESSION_STATUS.IDLE) {
        notifier.post({
          title: `Orca ready: ${workspace}`,
          message: message || 'Session is ready for the next task.',
          tags: ['white_check_mark'],
          priority: 'default',
        }).catch(() => {});
      } else if (status === SESSION_STATUS.NEEDS_INPUT) {
        notifier.post({
          title: `Input needed: ${workspace}`,
          message: message || 'A session is waiting for your response.',
          tags: ['bell'],
          priority: 'high',
        }).catch(() => {});
      }

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
      registry.updateStatus(sessionId, SESSION_STATUS.NEEDS_INPUT, message, options);

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

  server.tool(
    'orca_get_response',
    'Check if a human has responded to an orca_request_input call via the dashboard. Returns { response: string } if answered, or { response: null } if still waiting.',
    {
      sessionId: z.string().uuid().describe('Session ID to check for a response'),
    },
    async ({ sessionId }) => {
      const session = registry.get(sessionId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ response: session?.response ?? null }),
          },
        ],
      };
    }
  );

  server.tool(
    'orca_wait_for_response',
    'Block until the human responds via the dashboard, then return the response text. ' +
    'Self-heals: if the session already has a response when called, returns immediately. ' +
    'Returns { response: string } on success, { response: null, timedOut: true } on timeout, ' +
    'or { response: null, dismissed: true } if the session was dismissed before a response.',
    {
      sessionId: z.string().uuid().describe('Session ID to wait on'),
      timeoutMs: z.number().int().positive().optional()
        .describe('Max wait time in ms. Default: 7 days. Returns timedOut:true on expiry so you can re-call.'),
    },
    async ({ sessionId, timeoutMs = 7 * 24 * 60 * 60 * 1000 }) => {
      // Self-heal: if already responded, return immediately without waiting
      const existing = registry.get(sessionId);
      if (!existing) {
        return { content: [{ type: 'text', text: JSON.stringify({ response: null, error: 'session_not_found' }) }] };
      }
      if (existing.status === SESSION_STATUS.RESPONDED && existing.response !== null) {
        return { content: [{ type: 'text', text: JSON.stringify({ response: existing.response }) }] };
      }

      // No events wired — fall back to poll-once behavior
      if (!events) {
        return { content: [{ type: 'text', text: JSON.stringify({ response: existing.response ?? null }) }] };
      }

      return new Promise((resolve) => {
        let timer = null;

        function done(payload) {
          if (timer) { clearTimeout(timer); timer = null; }
          events.off('status_updated', onStatusUpdated);
          events.off('session_removed', onSessionRemoved);
          resolve({ content: [{ type: 'text', text: JSON.stringify(payload) }] });
        }

        function onStatusUpdated(session) {
          if (session.sessionId !== sessionId) return;
          if (session.status === SESSION_STATUS.RESPONDED) {
            // Read response from registry for freshest value
            const s = registry.get(sessionId);
            done({ response: s?.response ?? null });
          }
        }

        function onSessionRemoved({ sessionId: removedId }) {
          if (removedId !== sessionId) return;
          done({ response: null, dismissed: true });
        }

        events.on('status_updated', onStatusUpdated);
        events.on('session_removed', onSessionRemoved);

        timer = setTimeout(() => {
          timer = null;
          events.off('status_updated', onStatusUpdated);
          events.off('session_removed', onSessionRemoved);
          // Self-heal: re-read registry in case the event was missed
          const s = registry.get(sessionId);
          if (s?.response !== null && s?.response !== undefined) {
            resolve({ content: [{ type: 'text', text: JSON.stringify({ response: s.response }) }] });
          } else {
            resolve({ content: [{ type: 'text', text: JSON.stringify({ response: null, timedOut: true }) }] });
          }
        }, timeoutMs);
      });
    }
  );

  server.tool(
    'orca_check_prompt',
    'Check if the human has sent a proactive prompt from the mobile app. Returns { prompt: string } if one is pending, or { prompt: null } if none. Dequeues one prompt per call — call again if you want to drain all pending prompts. Sets status to working so the prompt is delivered exactly once.',
    {
      sessionId: z.string().uuid().describe('Session ID returned by orca_register_session'),
    },
    async ({ sessionId }) => {
      const session = registry.get(sessionId);
      const prompt = session?.pendingPrompt ?? null;
      if (prompt !== null) {
        registry.clearPrompt(sessionId);
        registry.updateStatus(sessionId, SESSION_STATUS.WORKING, `Working on: ${prompt}`);
      }
      return { content: [{ type: 'text', text: JSON.stringify({ prompt }) }] };
    }
  );
}
