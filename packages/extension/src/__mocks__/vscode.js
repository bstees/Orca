'use strict';
/**
 * Manual mock for the `vscode` module.
 * Used by Jest when running extension unit tests outside VS Code.
 *
 * Only the APIs exercised by Orca's extension code are implemented.
 */

const EventEmitter = require('node:events');

// ── Status bar ─────────────────────────────────────────────────────────────
class StatusBarItem {
  constructor() {
    this.text = '';
    this.tooltip = '';
    this.command = undefined;
    this.show = jest.fn();
    this.hide = jest.fn();
    this.dispose = jest.fn();
  }
}

// ── Output channel ──────────────────────────────────────────────────────────
class OutputChannel {
  constructor(name) {
    this.name = name;
    this.appendLine = jest.fn();
    this.clear = jest.fn();
    this.show = jest.fn();
    this.dispose = jest.fn();
  }
}

// ── Workspace folders ────────────────────────────────────────────────────────
const _workspaceFolders = [
  { uri: { fsPath: '/mock/workspace', scheme: 'file' }, name: 'mock-workspace', index: 0 },
];

// ── Configuration ────────────────────────────────────────────────────────────
const _config = {
  'orca.serverUrl': 'ws://127.0.0.1:7337',
  'orca.idleSeconds': 30,
};

class WorkspaceConfiguration {
  get(key) {
    return _config[key];
  }
  update(key, value) {
    _config[key] = value;
    return Promise.resolve();
  }
}

const workspaceConfiguration = new WorkspaceConfiguration();

// ── Git extension stub ────────────────────────────────────────────────────────
const _gitRepo = {
  state: { HEAD: { name: 'main' } },
};

const _gitApi = {
  repositories: [_gitRepo],
  onDidOpenRepository: jest.fn(),
};

const _gitExtension = {
  exports: { getAPI: jest.fn(() => _gitApi) },
  isActive: true,
};

// ── Extension API ─────────────────────────────────────────────────────────────
const extensions = {
  getExtension: jest.fn((id) => {
    if (id === 'vscode.git') return _gitExtension;
    return undefined;
  }),
};

// ── Window API ────────────────────────────────────────────────────────────────
const window = {
  createStatusBarItem: jest.fn(() => new StatusBarItem()),
  createOutputChannel: jest.fn((name) => new OutputChannel(name)),
  showInformationMessage: jest.fn(() => Promise.resolve(undefined)),
  showWarningMessage: jest.fn(() => Promise.resolve(undefined)),
  showErrorMessage: jest.fn(() => Promise.resolve(undefined)),
};

// ── Workspace API ─────────────────────────────────────────────────────────────
const workspace = {
  workspaceFolders: _workspaceFolders,
  name: 'mock-workspace',
  getConfiguration: jest.fn(() => workspaceConfiguration),
  onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
};

// ── Context stub (for activate) ────────────────────────────────────────────────
function makeExtensionContext(overrides = {}) {
  return {
    subscriptions: [],
    extensionPath: '/mock/extension',
    globalState: { get: jest.fn(), update: jest.fn(() => Promise.resolve()) },
    workspaceState: { get: jest.fn(), update: jest.fn(() => Promise.resolve()) },
    ...overrides,
  };
}

// ── Enums ─────────────────────────────────────────────────────────────────────
const StatusBarAlignment = { Left: 1, Right: 2 };

module.exports = {
  window,
  workspace,
  extensions,
  StatusBarAlignment,
  makeExtensionContext,
  // expose internals for test assertions
  _gitApi,
  _gitRepo,
  _workspaceFolders,
  _config,
};
