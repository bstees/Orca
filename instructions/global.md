# Orca — Global AI Instructions

You are working inside the **Orca** monorepo (`/Users/bstees/work/orca/`).
Orca is an AI workstream orchestration platform: it lets multiple AI coding
sessions register themselves with a central server, report status, and request
human input — triggering push notifications (ntfy.sh) and a real-time dashboard.

---

## Starting a Session

1. Read `/memories/session/plan.md` first — it has settled decisions and next steps.
2. Run `yarn test` — all 276 tests must pass before you change anything.
3. Do **not** ask the user about anything already decided in these instruction files or the plan. Check the files first.
4. Prioritise eliminating feedback blockages — if you can get a non-human signal (running a script, checking a test, reading a log file), do that before asking a human.

---

## Stack & Constraints

- **Language:** Plain JavaScript only. No TypeScript, no `.ts` files, no `tsc`.
- **Package manager:** Yarn (workspaces monorepo). Use `yarn` not `npm`.
- **React:** Yes — with PropTypes, not TypeScript generics.
- **Tests:** Jest + React Testing Library. Run `yarn test` from root.
- **Mutation testing:** Stryker on all `utils/**` and `hooks/**`. Run `yarn mutate`.
- **Principles:** SOLID. Single responsibility per file. Dependencies injected — no concrete coupling across packages.
- **No console.log in source** — use the injected logger everywhere.

---

## Monorepo Layout

```
packages/
  shared/     — plain JS protocol objects, zero external deps
  server/     — Fastify + MCP + WebSocket + SQLite
  extension/  — VS Code extension (CommonJS)
  app/        — React + Capacitor dashboard
  desktop/    — Electron wrapper (server + app in one binary)
scripts/      — feedback harness scripts (probe-mcp.js, mock-extension.js, test-ntfy.js)
instructions/ — this file + per-domain instruction files
docs/         — log-format.md and other reference docs
```

---

## MCP Tools (primary mechanism)

AI sessions MUST call these tools at the appropriate times:

### `orca_register_session`

Call at the **start** of every session.

```json
{
  "workspaceName": "my-project",
  "gitBranch": "feature/my-branch",
  "description": "Brief summary of what this session is doing"
}
```

Returns `{ "sessionId": "<uuid>" }` — store this for subsequent calls.

### `orca_update_status`

Call whenever your work phase changes.

```json
{
  "sessionId": "<uuid>",
  "status": "working | idle | blocked | done",
  "message": "Human-readable summary of current state"
}
```

### `orca_request_input`

Call when you need a human decision before you can continue.
This triggers a push notification and shows a banner in the dashboard.

```json
{
  "sessionId": "<uuid>",
  "message": "What should I do about X?",
  "options": ["Option A", "Option B"]
}
```

After calling this tool, **stop and wait** — do not proceed until you receive
a response. Do not loop or poll.

---

## MCP Resources (pull at startup)

Read these resources at the start of a session to load domain-specific instructions:

| URI                             | When to read                               |
| ------------------------------- | ------------------------------------------ |
| `instructions://global`         | Always                                     |
| `instructions://frontend`       | React/UI work in `packages/app/`           |
| `instructions://backend/node`   | Server work in `packages/server/`          |
| `instructions://orca-extension` | Extension work in `packages/extension/`    |
| `sessions://active`             | When you want to see other active sessions |

---

## Feedback Harnesses (use these, don't ask a human)

Before asking for human input on technical questions, try these:

```bash
# Test MCP tools without Copilot:
node scripts/probe-mcp.js

# Test WebSocket protocol without the real extension:
node scripts/mock-extension.js

# Test ntfy push delivery without a phone:
node scripts/test-ntfy.js
```

---

## Session Lifecycle

```
start → orca_register_session
      → (read instruction resources)
      → orca_update_status(working)
      → ... do work ...
      → orca_request_input  ← if blocked
      → orca_update_status(done)
```
