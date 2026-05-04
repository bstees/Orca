# Orca — VS Code Extension Instructions (`packages/extension/`)

Read `instructions://global` first.

---

## Package Type

CommonJS (`"type": "commonjs"`). Use `require()` not `import`.

---

## File Responsibilities (single responsibility per file)

```
src/extension.js                ← activate(context) / deactivate(); wires services
src/services/
  workspaceInfo.js              ← reads workspace folders, name, .code-workspace
  gitBranch.js                  ← reads git branch via vscode.git extension API
  logWatcher.js                 ← finds storage hash, watches debug log, parses events
  orcaClient.js                 ← WebSocket client to Orca server
src/ui/
  statusBar.js                  ← status bar item showing Orca connection state
```

---

## VS Code API Patterns

```js
// Always read config through vscode.workspace.getConfiguration
const config = vscode.workspace.getConfiguration("orca");
const serverUrl = config.get("serverUrl"); // default: ws://localhost:7337

// Disposables — push everything to context.subscriptions
context.subscriptions.push(statusBarItem);
context.subscriptions.push(watcher);
```

---

## orcaClient.js

- Connects to `config.serverUrl` (replaces `ws://` with `http://` for MCP, keeps `ws://` for extension WS endpoint `/ws/extension`).
- Queues events when server is unreachable; drains queue on reconnect.
- Reconnect with exponential back-off (max 30s).
- Exposes: `connect()`, `disconnect()`, `send(type, payload)`, `onMessage(handler)`.

---

## logWatcher.js

See `docs/log-format.md` for the debug log schema.

Key points:

- Find storage folder by reading `workspace.json` in each workspaceStorage subfolder.
- Watch `main.jsonl` with `fs.watch()` or `vscode.workspace.createFileSystemWatcher`.
- On each file change, read new lines since last offset.
- Parse each line as JSON; handle malformed lines gracefully.
- Emit `idle` event to orcaClient if mtime hasn't changed for `orca.idleSeconds`.

---

## Testing

All services are factory functions that accept injected VS Code API mocks:

```js
// gitBranch.js
module.exports = function createGitBranchService(vscodeApi) { ... };
```

This allows full unit testing without launching Extension Development Host.
Mock `vscode` module in jest config:

```js
moduleNameMapper: { '^vscode$': '<rootDir>/src/__mocks__/vscode.js' }
```

Do not write tests that compare `Date.now()` timestamps for ordering unless you
control the clock — these are inherently flaky when multiple operations complete
within the same millisecond. Use mock timestamps or compare fields other than time.
