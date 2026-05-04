'use strict';
const vscode = require('vscode');
const { createWorkspaceInfoService } = require('./services/workspaceInfo');
const { createGitBranchService } = require('./services/gitBranch');
const { createLogWatcher } = require('./services/logWatcher');
const { createOrcaClient } = require('./services/orcaClient');
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

  await orcaClient.connect();

  const workspace = workspaceInfo.getCurrent();
  const branch = await gitBranch.getCurrent();

  await orcaClient.send('session_registered', {
    workspaceName: workspace?.name ?? 'unknown',
    gitBranch: branch ?? 'unknown',
    description: `VS Code session in ${workspace?.name ?? 'unknown'}`,
  });

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
