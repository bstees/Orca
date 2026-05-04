# Orca — Backend/Node Instructions (`packages/server/`)

Read `instructions://global` first.

---

## Stack

- **Fastify v5** — use `fastify()`, register plugins with `fastify.register()`.
- **@fastify/websocket** — for `/ws/extension` and `/ws/dashboard`.
- **@modelcontextprotocol/sdk** — MCP server mounted at `/mcp` via HTTP+SSE.
- **better-sqlite3** — synchronous SQLite; wrap in `src/registry/sessions.js`.

---

## File Responsibilities (single responsibility per file)

```
src/index.js            ← creates Fastify, mounts plugins, starts listener
src/config.js           ← reads env/config; injected everywhere
src/plugins/
  websocket.js          ← /ws/extension and /ws/dashboard routes
  mcp.js                ← mounts McpServer at /mcp
  static.js             ← serves packages/app/dist at /
  api.js                ← GET /api/sessions, GET /api/health
src/registry/
  sessions.js           ← in-memory Map + SQLite persistence; exported factory
src/notifications/
  ntfy.js               ← single function: postNotification(config, alert)
src/mcp/
  tools.js              ← MCP tool definitions and handlers
  resources.js          ← MCP resource definitions and handlers
  index.js              ← creates McpServer, registers tools+resources, exports
```

---

## Dependency Injection Pattern

All modules export **factory functions**, not singletons:

```js
// sessions.js
export function createSessionRegistry(db) { ... }

// ntfy.js
export function createNtfyNotifier(config) { ... }

// tools.js
export function createTools(registry, notifier) { ... }
```

`src/index.js` is the only place that wires everything together.

---

## Session Registry API

```js
const registry = createSessionRegistry(db);

registry.register({ sessionId, workspaceName, gitBranch, description }) → session
registry.updateStatus(sessionId, status, message) → void
registry.getAll() → session[]
registry.get(sessionId) → session | undefined
registry.remove(sessionId) → void
```

Sessions are persisted to SQLite and replayed on server restart.

---

## Testing

- Unit test every module in isolation with mocked dependencies.
- Never spin up a real Fastify server in unit tests — use `fastify.inject()` for route tests.
- SQLite tests use `:memory:` database.

---

## LaunchAgent

`packages/server/launchd/com.orca.server.plist` — starts server on login.
Default port: **7337**.
