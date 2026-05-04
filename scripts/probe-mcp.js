/**
 * scripts/probe-mcp.js
 *
 * Phase 0 feedback harness — smoke tests each MCP tool against the Orca server
 * without needing Copilot connected. Run with:
 *
 *   node scripts/probe-mcp.js
 *
 * Exits 0 on full pass, 1 on any failure.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const SERVER_URL = process.env.ORCA_SERVER_URL ?? 'http://127.0.0.1:7337';
const MCP_URL = `${SERVER_URL}/mcp`;

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  process.stdout.write(`  ✓ ${label}\n`);
}

function fail(label, err) {
  failed++;
  process.stderr.write(`  ✗ ${label}: ${err?.message ?? err}\n`);
}

async function run() {
  process.stdout.write(`\nProbing MCP server at ${MCP_URL}\n\n`);

  const transport = new SSEClientTransport(new URL(MCP_URL));
  const client = new Client({ name: 'orca-probe', version: '0.1.0' });

  try {
    await client.connect(transport);
    ok('Connected to MCP server via SSE');
  } catch (err) {
    fail('Connect to MCP server', err);
    process.stdout.write('\nMake sure the Orca server is running: yarn workspace @orca/server dev\n\n');
    process.exit(1);
  }

  // --- List tools ---
  let tools;
  try {
    const result = await client.listTools();
    tools = result.tools.map((t) => t.name);
    ok(`listTools → [${tools.join(', ')}]`);
  } catch (err) {
    fail('listTools', err);
  }

  // --- orca_register_session ---
  let sessionId;
  try {
    const result = await client.callTool({
      name: 'orca_register_session',
      arguments: {
        workspaceName: 'probe-test',
        gitBranch: 'main',
        description: 'Phase 0 MCP probe script',
      },
    });
    sessionId = result.content?.[0]?.text ? JSON.parse(result.content[0].text).sessionId : null;
    if (!sessionId) throw new Error('No sessionId in response');
    ok(`orca_register_session → sessionId: ${sessionId}`);
  } catch (err) {
    fail('orca_register_session', err);
  }

  // --- orca_update_status ---
  if (sessionId) {
    try {
      await client.callTool({
        name: 'orca_update_status',
        arguments: {
          sessionId,
          status: 'working',
          message: 'Probe: status update',
        },
      });
      ok('orca_update_status → ok');
    } catch (err) {
      fail('orca_update_status', err);
    }

    // --- orca_request_input ---
    try {
      await client.callTool({
        name: 'orca_request_input',
        arguments: {
          sessionId,
          message: 'Probe: which approach do you prefer?',
          options: [
            'Option A',
            'Option B',
          ],
        },
      });
      ok('orca_request_input → ok');
    } catch (err) {
      fail('orca_request_input', err);
    }
  }

  // --- List resources ---
  try {
    const result = await client.listResources();
    const uris = result.resources.map((r) => r.uri);
    ok(`listResources → [${uris.join(', ')}]`);
  } catch (err) {
    fail('listResources', err);
  }

  // --- Read instructions://global resource ---
  try {
    const result = await client.readResource({ uri: 'instructions://global' });
    const text = result.contents?.[0]?.text ?? '';
    if (!text.length) throw new Error('Empty resource content');
    ok(`instructions://global → ${text.length} chars`);
  } catch (err) {
    fail('instructions://global', err);
  }

  // --- Read sessions://active resource ---
  try {
    const result = await client.readResource({ uri: 'sessions://active' });
    const data = JSON.parse(result.contents?.[0]?.text ?? '[]');
    ok(`sessions://active → ${data.length} active session(s)`);
  } catch (err) {
    fail('sessions://active', err);
  }

  await client.close();

  process.stdout.write(`\n${passed} passed, ${failed} failed\n\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
