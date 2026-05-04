# Copilot Chat Debug Log Format

**Source:** `~/Library/Application Support/Code/User/workspaceStorage/<hash>/GitHub.copilot-chat/debug-logs/<session-id>/main.jsonl`

## File Structure

- One JSONL file per session: `main.jsonl`
- One JSON object per line
- Companion `models.json` (static, model registry)

## Event Schema

Each line is a JSON object with these top-level fields:

| Field    | Type   | Description                                      |
| -------- | ------ | ------------------------------------------------ |
| `v`      | number | Schema version (currently `1`)                   |
| `ts`     | number | Unix timestamp in **milliseconds**               |
| `dur`    | number | Duration in ms (0 for instant events)            |
| `sid`    | string | Session UUID (matches the directory name)        |
| `type`   | string | Event type (see below)                           |
| `name`   | string | Human-readable event name (often same as `type`) |
| `spanId` | string | Trace span ID                                    |
| `status` | string | `"ok"` or `"error"`                              |
| `attrs`  | object | Event-specific attributes                        |

## Known Event Types

### `session_start`

Emitted when the Copilot extension initialises a chat session.

```json
{
  "v": 1,
  "ts": 1776952018785,
  "dur": 0,
  "sid": "199783b1-e51a-4c4f-abb2-8eb4d5fcdda2",
  "type": "session_start",
  "name": "session_start",
  "spanId": "session-start-199783b1-e51a-4c4f-abb2-8eb4d5fcdda2",
  "status": "ok",
  "attrs": {
    "copilotVersion": "0.44.2",
    "vscodeVersion": "1.116.0"
  }
}
```

**attrs fields:**

| Field            | Type   | Description                      |
| ---------------- | ------ | -------------------------------- |
| `copilotVersion` | string | GitHub Copilot extension version |
| `vscodeVersion`  | string | VS Code version                  |

## Log Watcher Strategy (for `packages/extension/src/services/logWatcher.js`)

### Finding the right log directory

Each workspace storage folder contains a `workspace.json` that maps to the workspace path.
Enumerate `~/Library/Application Support/Code/User/workspaceStorage/*/GitHub.copilot-chat/debug-logs/`
and match against the current VS Code workspace.

### Session detection

- New file in `debug-logs/` → new session (directory = session UUID)
- `session_start` event → session is alive and has `sid`, `ts`, `attrs.copilotVersion`

### NEEDS_INPUT heuristics

The log currently only emits `session_start`. Future events to watch for (as Copilot adds telemetry):

- Long gap between last `ts` and `Date.now()` → session may be waiting
- `status: "error"` events → session may have stalled
- Absence of new events for `orca.idleSeconds` (default 30s) → emit `idle` to server

### Fallback: log tail polling

Since logs only have `session_start` today, the extension should:

1. Register the session via MCP `orca_register_session` (primary path)
2. Watch log file mtime as a heartbeat — last modified time = last activity
3. If mtime hasn't changed for `idleSeconds`, emit idle event to Orca server

## Open Questions

- Do agent-mode turns emit additional event types? (investigate with a long-running agent task)
- Does `dur` get populated for LLM request spans?
- Is there a `turn_start` / `turn_end` event type that would let us detect waiting-for-input precisely?
