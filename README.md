# Orca

> AI workstream orchestration — track multiple AI coding sessions from a single dashboard, get push notifications when they need your input.

## What is Orca?

When you run several AI coding sessions in parallel (e.g., one per feature branch), it's hard to know which ones are blocked, which are still working, and which need a decision from you.

Orca solves this with three moving parts:

| Part                  | What it does                                                           |
| --------------------- | ---------------------------------------------------------------------- |
| **Server**            | Central hub — tracks sessions, serves the dashboard, exposes MCP tools |
| **VS Code Extension** | Registers itself with the server, reports status & idle detection      |
| **Dashboard**         | Real-time React web UI — see all sessions at a glance                  |

AI sessions communicate via **MCP (Model Context Protocol)** tools. When a session needs your input it calls `orca_request_input`, which fires a push notification to your phone (via [ntfy.sh](https://ntfy.sh)) and shows a banner in the dashboard.

```
┌─────────────────────────────────────────────────────┐
│  VS Code window A    VS Code window B    window C   │
│  [extension]         [extension]         [extension] │
│       │                    │                  │      │
│       └──────────┬─────────┘                  │      │
│                  ▼                             │      │
│           Orca server :7337  ◄─────────────────┘      │
│           MCP + WebSocket                             │
│                  │                                    │
│          ┌───────┴────────┐                          │
│          ▼                ▼                          │
│     Dashboard        ntfy.sh push                    │
│   (browser/mobile)   (your phone)                    │
└─────────────────────────────────────────────────────┘
```

---

## Requirements

- **Node.js ≥ 22** (see `.nvmrc` — use `nvm use` to switch)
- **Yarn** (`corepack enable` or `npm i -g yarn`)
- **ntfy.sh** — free push notifications. Subscribe to your topic on the [ntfy app](https://ntfy.sh/app) or any ntfy client.

---

## Installation

```bash
# Clone and install all workspace dependencies
git clone <repo-url> orca
cd orca
yarn install
```

---

## Quick Start

### Option A — Desktop app (server + dashboard in one click)

> ⚠️ **Don't run `yarn dev` (standalone server) at the same time.** The desktop app starts the server internally. If port 7337 is already occupied it will reuse the existing server, but running both is unnecessary.

```bash
# First time only — rebuild better-sqlite3 against Electron's Node version:
yarn workspace @orca/desktop rebuild-native

# Dev mode — Electron loads the Vite dev server for hot-reload
ORCA_DEV=1 yarn dev:app &   # start Vite on :5173
yarn dev:desktop             # launch Electron (opens window + tray icon)
```

The desktop app starts the Orca server internally and opens the dashboard in a native window. A tray icon lets you show/hide the window and quit.

### Option B — Server + browser (headless)

### 1 — Start the server (Option B)

```bash
yarn dev
# or explicitly:
yarn workspace @orca/server dev
```

The server listens on `http://127.0.0.1:7337` by default.

### 2 — Open the dashboard

```bash
yarn workspace @orca/app dev
```

Visit `http://localhost:5173` in your browser.

### 3 — Try demo mode (no server needed)

The dashboard has a built-in demo mode that replays realistic mock data:

```bash
yarn workspace @orca/app demo
```

### 4 — Install the VS Code extension

The extension lives in `packages/extension/`. Load it in development mode:

1. Open `packages/extension/` as a VS Code workspace
2. Press **F5** to launch the Extension Development Host
3. The extension auto-registers with the server on startup

---

## Configuration

All server options are set via environment variables:

| Variable        | Default           | Description                                  |
| --------------- | ----------------- | -------------------------------------------- |
| `ORCA_PORT`     | `7337`            | Server port                                  |
| `ORCA_HOST`     | `127.0.0.1`       | Bind address                                 |
| `ORCA_DB_PATH`  | `./orca.db`       | SQLite database path                         |
| `NTFY_BASE_URL` | `https://ntfy.sh` | ntfy server URL (self-host supported)        |
| `NTFY_TOPIC`    | `orca-alerts`     | ntfy topic — subscribe to this on your phone |

Example — custom topic and self-hosted ntfy:

```bash
NTFY_TOPIC=my-personal-alerts NTFY_BASE_URL=https://ntfy.example.com yarn dev
```

---

## How AI Sessions Use Orca

An AI session (e.g., GitHub Copilot) connects via MCP. Point your MCP client at:

```
http://127.0.0.1:7337/mcp
```

### MCP Tools

#### `orca_register_session`

Call at the start of every session.

```json
{
  "workspaceName": "my-project",
  "gitBranch": "feature/auth",
  "description": "Implementing JWT authentication"
}
```

Returns `{ "sessionId": "<uuid>" }` — keep this for subsequent calls.

#### `orca_update_status`

Call whenever your work phase changes.

```json
{
  "sessionId": "<uuid>",
  "status": "working",
  "message": "Running tests"
}
```

Valid statuses: `registered` · `working` · `idle` · `blocked` · `needs_input` · `done`

#### `orca_request_input`

Call when you need a human decision before continuing. Triggers a push notification and dashboard banner. **Stop and wait** after calling — do not loop.

```json
{
  "sessionId": "<uuid>",
  "message": "Should I use PostgreSQL or SQLite?",
  "options": ["PostgreSQL", "SQLite"]
}
```

### MCP Resources

Pull at session start for context:

| URI                             | Contents                           |
| ------------------------------- | ---------------------------------- |
| `instructions://global`         | Global Orca instructions           |
| `instructions://frontend`       | React / UI conventions             |
| `instructions://backend/node`   | Server / Node conventions          |
| `instructions://orca-extension` | Extension conventions              |
| `sessions://active`             | Live list of other active sessions |

---

## REST API

| Method | Path            | Description                 |
| ------ | --------------- | --------------------------- |
| `GET`  | `/api/health`   | Health check `{ ok: true }` |
| `GET`  | `/api/sessions` | All registered sessions     |

---

## Development

### Running tests

```bash
# All packages
yarn test

# Single package
yarn workspace @orca/shared jest
yarn workspace @orca/server jest
yarn workspace @orca/app jest
yarn workspace @orca/extension jest
```

### Mutation testing

```bash
# All packages (excluding extension)
yarn mutate

# Single package
yarn workspace @orca/shared mutate
yarn workspace @orca/app mutate
```

Target: ≥ 80% mutation score. Current scores: `shared` 100% · `app` 98%.

### Storybook

```bash
yarn workspace @orca/app storybook   # dev server on :6007
yarn workspace @orca/app build-storybook
```

### Harness scripts (fast feedback without a real AI session)

```bash
# Test all 3 MCP tools end-to-end (server must be running)
node scripts/probe-mcp.js

# Simulate a VS Code extension connecting over WebSocket
node scripts/mock-extension.js

# Test ntfy push delivery
node scripts/test-ntfy.js
```

---

## Project Structure

```
orca/
├── packages/
│   ├── shared/       # Protocol objects, schema, fixtures — no external deps
│   ├── server/       # Fastify server — MCP, WebSocket, SQLite, REST, ntfy
│   ├── extension/    # VS Code extension (CommonJS)
│   ├── app/          # React dashboard (Vite + Capacitor)
│   └── desktop/      # Electron desktop app — tray + embedded server + window
├── scripts/          # Harness scripts for manual / CI feedback
├── instructions/     # AI instruction files (loaded via MCP resources)
└── docs/             # Reference docs (log format, etc.)
```

---

## Stack

| Layer           | Technology                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Server          | [Fastify](https://fastify.dev) · [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) · [@fastify/websocket](https://github.com/fastify/fastify-websocket) |
| MCP             | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)                                                                                |
| Dashboard       | [React 19](https://react.dev) · [Vite](https://vitejs.dev) · [Capacitor](https://capacitorjs.com)                                                                  |
| Desktop         | [Electron](https://electronjs.org) · [electron-builder](https://www.electron.build)                                                                                |
| Push            | [ntfy.sh](https://ntfy.sh)                                                                                                                                         |
| Testing         | [Jest 30](https://jestjs.io) · [Testing Library](https://testing-library.com) · [Stryker](https://stryker-mutator.io)                                              |
| Language        | Plain JavaScript — no TypeScript                                                                                                                                   |
| Package manager | [Yarn workspaces](https://yarnpkg.com/features/workspaces)                                                                                                         |
