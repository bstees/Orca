import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INSTRUCTIONS_DIR = join(__dirname, '../../../../instructions');

function readInstruction(relPath) {
  try {
    return readFileSync(join(INSTRUCTIONS_DIR, relPath), 'utf8');
  } catch {
    return `# ${relPath}\n\n(instruction file not found)`;
  }
}

/**
 * Registers Orca MCP resources on the given McpServer instance.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {import('../registry/sessions.js').SessionRegistry} registry
 */
export function registerResources(server, registry) {
  server.resource(
    'instructions-global',
    'instructions://global',
    { mimeType: 'text/markdown', description: 'Global Orca AI instructions' },
    async () => ({
      contents: [
        {
          uri: 'instructions://global',
          mimeType: 'text/markdown',
          text: readInstruction('global.md'),
        },
      ],
    })
  );

  server.resource(
    'instructions-frontend',
    'instructions://frontend',
    { mimeType: 'text/markdown', description: 'Frontend (React/app) AI instructions' },
    async () => ({
      contents: [
        {
          uri: 'instructions://frontend',
          mimeType: 'text/markdown',
          text: readInstruction('frontend.md'),
        },
      ],
    })
  );

  server.resource(
    'instructions-backend-node',
    'instructions://backend/node',
    { mimeType: 'text/markdown', description: 'Backend Node.js AI instructions' },
    async () => ({
      contents: [
        {
          uri: 'instructions://backend/node',
          mimeType: 'text/markdown',
          text: readInstruction('backend/node.md'),
        },
      ],
    })
  );

  server.resource(
    'instructions-orca-extension',
    'instructions://orca-extension',
    { mimeType: 'text/markdown', description: 'VS Code extension AI instructions' },
    async () => ({
      contents: [
        {
          uri: 'instructions://orca-extension',
          mimeType: 'text/markdown',
          text: readInstruction('orca-extension.md'),
        },
      ],
    })
  );

  server.resource(
    'sessions-active',
    'sessions://active',
    { mimeType: 'application/json', description: 'Live active session roster' },
    async () => ({
      contents: [
        {
          uri: 'sessions://active',
          mimeType: 'application/json',
          text: JSON.stringify(registry.getAll(), null, 2),
        },
      ],
    })
  );
}
