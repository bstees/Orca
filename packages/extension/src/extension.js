'use strict';
const vscode = require('vscode');
const { createWorkspaceInfoService } = require('./services/workspaceInfo');
const { createGitBranchService } = require('./services/gitBranch');
const { createLogWatcher } = require('./services/logWatcher');
const { createOrcaClient } = require('./services/orcaClient');
const { createDashboardWatcher } = require('./services/dashboardWatcher');
const { createStatusBar } = require('./ui/statusBar');

/** @type {ReturnType<typeof createOrcaClient> | null} */
let orcaClient = null;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  const config = vscode.workspace.getConfiguration('orca');
  const serverUrl = config.get('serverUrl');
  const idleSeconds = config.get('idleSeconds');

  const workspaceInfo = createWorkspaceInfoService(vscode);
  const gitBranch = createGitBranchService(vscode);
  const statusBar = createStatusBar(vscode);
  orcaClient = createOrcaClient({ serverUrl });

  context.subscriptions.push(statusBar.item);

  orcaClient.onStatusChange((connected) => {
    statusBar.update(connected ? 'connected' : 'disconnected');
  });

  // Permission changes are local editor actions, never remote server commands.

  // Re-send session_registered on every connect (initial + reconnects after server restart).
  // Must be registered BEFORE connect() so the handler is in place when the socket opens.
  // Async: gitBranch.getCurrent() re-runs each time so reconnects always get the live branch.
  orcaClient.onConnect(async () => {
    try {
      const workspace = workspaceInfo.getCurrent();
      const branch = await gitBranch.getCurrent();
      const rawMode = vscode.workspace.getConfiguration('chat').get('permissions.default');
      const approvalMode = typeof rawMode === 'string' && rawMode.length ? rawMode : 'default';
      orcaClient.send('session_registered', {
        workspaceName: workspace?.name ?? 'unknown',
        gitBranch: branch ?? 'unknown',
        description: `VS Code session in ${workspace?.name ?? 'unknown'}`,
        approvalMode,
      });
    } catch {
      // Fallback: register without optional fields so session always appears
      const workspace = workspaceInfo.getCurrent();
      orcaClient.send('session_registered', {
        workspaceName: workspace?.name ?? 'unknown',
        gitBranch: 'unknown',
        description: `VS Code session in ${workspace?.name ?? 'unknown'}`,
        approvalMode: 'default',
      });
    }
  });

  await orcaClient.connect();

  // Keep server in sync when user changes the setting locally
  const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('chat.permissions.default')) {
      const rawMode = vscode.workspace.getConfiguration('chat').get('permissions.default');
      const updated = typeof rawMode === 'string' && rawMode.length ? rawMode : 'default';
      orcaClient.send('status_updated', {
        sessionId: orcaClient.getSessionId(),
        approvalMode: updated,
      });
    }
  });
  context.subscriptions.push(configWatcher);

  // Watch the dashboard for needs_input events on our own session and show
  // a VS Code notification so the developer can respond without leaving the editor.
  // Also watches for 📱-prefixed mobile prompts on any session and opens Copilot Chat.
  const dashboardWatcher = createDashboardWatcher({
    serverUrl: config.get('serverUrl'),
    getSessionId: () => orcaClient.getSessionId(),
    onNeedsInput: async (message, options) => {
      statusBar.update('needs_input');
      const items = options.length > 0 ? options : ['OK'];
      const choice = await vscode.window.showInformationMessage(
        `Orca needs input: ${message || '(no message)'}`,
        ...items
      );
      if (choice) {
        orcaClient.send('alert_response', {
          sessionId: orcaClient.getSessionId(),
          option: choice,
        });
        statusBar.update('connected');
      }
    },
    onMobilePrompt: async (prompt) => {
      await vscode.commands.executeCommand('workbench.action.chat.open', { query: prompt });
    },
  });

  dashboardWatcher.start();
  context.subscriptions.push({ dispose: () => dashboardWatcher.stop() });

  const logWatcher = createLogWatcher({ vscode, idleSeconds, onIdle: () => {
    orcaClient.send('status_updated', { status: 'idle', message: 'No activity detected' });
  }});

  await logWatcher.start();
  context.subscriptions.push({ dispose: () => logWatcher.stop() });
  context.subscriptions.push({ dispose: () => orcaClient.disconnect() });
}

function deactivate() {
  if (orcaClient) {
    orcaClient.disconnect();
  }
}

module.exports = { activate, deactivate };
