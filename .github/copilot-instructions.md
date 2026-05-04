# Orca — Copilot Session Bootstrap

This file is read automatically by VS Code Copilot at the start of every session.
Read the instruction files listed below before writing any code.

---

## Required Reading (load these first)

| File | Scope |
|---|---|
| `instructions/global.md` | Stack, constraints, monorepo layout, MCP tool protocol |
| `instructions/frontend.md` | React/CSS conventions, component layout, testing pattern |
| `instructions/backend/node.md` | Fastify, SQLite, dependency injection, module layout |
| `instructions/orca-extension.md` | VS Code extension architecture, service wiring |

---

## Starting a Session

Before writing any code:
1. Read `/memories/session/plan.md` if it exists — it contains settled decisions and next steps.
2. Read the required instruction files listed above.
3. Do **not** ask about anything already decided in those files. If you're uncertain, check the files first.
4. Run `yarn test` to confirm baseline. All 276 tests must pass before you touch anything.

---

## Implementation Status

All four packages are fully scaffolded and operational. A `packages/desktop/` Electron wrapper also exists.

### `packages/shared/`
- `events.js` — typed event constants (protocol layer)
- `schema.js` — shared validation schemas
- `fixtures.js` — test fixture factories
- Full unit + Stryker mutation test coverage

### `packages/server/`
- Fastify v5 server on port `7337`
- MCP tools: `orca_register_session`, `orca_update_status`, `orca_request_input`
- MCP resources defined in `src/mcp/resources.js`
- WebSocket endpoints: `/ws/extension`, `/ws/dashboard`
- SQLite session registry (`src/registry/sessions.js`) with in-memory Map + persistence
- ntfy.sh push notifications (`src/notifications/ntfy.js`)
- REST API: `GET /api/sessions`, `GET /api/health`

### `packages/app/`
- React dashboard (Vite, port `5173`)
- Components: `AlertBanner`, `SessionCard`, `SessionsList`, `StatusBadge`
- Hooks: `useOrcaSocket` (WebSocket), `useSessions` (session state)
- Utils: `status.js` (status label/color helpers), `time.js` (relative time formatting)
- Storybook stories co-located with each component
- Demo mode: `yarn workspace @orca/app demo`

### `packages/extension/`
- CommonJS VS Code extension
- Services: `workspaceInfo`, `gitBranch`, `logWatcher`, `orcaClient`
- UI: `statusBar.js` (connection state indicator)
- All services are factory functions — fully unit-testable without Extension Host

### `packages/desktop/`
- Electron wrapper — bundles server + app into a single desktop binary
- `server-bridge.js` — spawns/manages the server process
- `tray.js` — system tray icon with show/hide/quit
- `window.js` — main browser window management
- Build: `electron-builder` (see `electron-builder.config.cjs`)

---

## Running the Project

```bash
# All tests
yarn test

# Run one package
yarn workspace @orca/server test
yarn workspace @orca/app test
yarn workspace @orca/extension test
yarn workspace @orca/shared test

# Dev: server only
yarn dev

# Dev: dashboard only
yarn workspace @orca/app dev

# Dev: desktop (Electron) — preferred for full-stack dev
ORCA_DEV=1 yarn dev:app &
yarn dev:desktop

# Mutation tests
yarn mutate
```

---

## Key Architectural Decisions (already made — do not revisit)

- **No TypeScript** — plain JS + PropTypes throughout
- **Yarn workspaces** — `yarn`, never `npm`
- **Dependency injection** — every module is a factory function; no module-level singletons
- **Custom element prefix** — all React top-level elements use `orc-*` (e.g. `<orc-session-card>`)
- **CSS** — plain co-located CSS, `--orc-*` custom properties, no preprocessor, no CSS modules
- **MCP as the AI integration surface** — AI sessions talk to Orca only via MCP tools
- **No console.log** — use the injected logger
- **`class` vs `className`** — `<orc-*>` custom elements use `class`; all standard HTML elements (`<div>`, `<span>`, `<p>`, `<header>`, `<button>`, etc.) use `className`. Console warnings about this are real bugs, not noise.
- **Sort at call site** — registry methods like `getAll()` return insertion order; sort in the route/consumer, not the registry
- **SOLID** — single responsibility per file; no cross-package concrete coupling
- **Tests before code** — run `yarn test` first; all 276 must pass before any change

---

## Test Commands

```bash
# Run all workspace tests
yarn test

# Run one package
yarn workspace @orca/server test
yarn workspace @orca/app test
yarn workspace @orca/extension test
yarn workspace @orca/shared test
```
