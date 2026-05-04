/**
 * scripts/test-ntfy.js
 *
 * Phase 0 feedback harness — POSTs a notification to ntfy.sh and reads it back
 * via the ntfy JSON API. Fully automated — no phone required.
 *
 * Run with:
 *   node scripts/test-ntfy.js
 *
 * Optional env vars:
 *   NTFY_BASE_URL  (default https://ntfy.sh)
 *   NTFY_TOPIC     (default orca-dev-<random> — auto-generated and printed)
 */

const BASE_URL = process.env.NTFY_BASE_URL ?? 'https://ntfy.sh';
const TOPIC = process.env.NTFY_TOPIC ?? `orca-dev-${Math.random().toString(36).slice(2, 10)}`;
const TITLE = 'Orca Probe';
const MESSAGE = `Test notification at ${new Date().toISOString()}`;
const TAG = 'white_check_mark';

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  process.stdout.write(`  ✓ ${label}\n`);
}

function fail(label, reason) {
  failed++;
  process.stderr.write(`  ✗ ${label}: ${reason}\n`);
}

async function postNotification() {
  const res = await fetch(`${BASE_URL}/${TOPIC}`, {
    method: 'POST',
    headers: {
      Title: TITLE,
      Tags: TAG,
      Priority: 'default',
    },
    body: MESSAGE,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.id;
}

async function pollForMessage(messageId, retries = 10, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    await new Promise((r) => setTimeout(r, delayMs));

    const res = await fetch(`${BASE_URL}/${TOPIC}/json?poll=1&since=all`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Poll HTTP ${res.status}`);

    const text = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.id === messageId) return event;
      } catch {
        // skip malformed lines
      }
    }
  }
  throw new Error('Message not found after polling');
}

async function run() {
  process.stdout.write(`\ntntfy smoke test\n`);
  process.stdout.write(`  base: ${BASE_URL}\n`);
  process.stdout.write(`  topic: ${TOPIC}\n\n`);

  let messageId;
  try {
    messageId = await postNotification();
    ok(`POST notification → id: ${messageId}`);
  } catch (err) {
    fail('POST notification', err.message);
    process.exit(1);
  }

  try {
    const event = await pollForMessage(messageId);
    if (event.message !== MESSAGE) throw new Error(`Body mismatch: "${event.message}"`);
    if (event.title !== TITLE) throw new Error(`Title mismatch: "${event.title}"`);
    ok(`GET notification → message verified`);
  } catch (err) {
    fail('GET notification', err.message);
  }

  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  process.stdout.write(`\nTo subscribe on mobile: ntfy subscribe ${TOPIC}\n\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
