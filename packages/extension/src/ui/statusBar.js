'use strict';

const STATUS_LABELS = {
  connected: '$(circle-filled) Orca',
  disconnected: '$(circle-outline) Orca',
};

/**
 * @param {typeof import('vscode')} vscode
 */
function createStatusBar(vscode) {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.tooltip = 'Orca — AI session orchestrator';
  item.text = STATUS_LABELS.disconnected;
  item.show();

  return {
    item,
    update(state) {
      item.text = STATUS_LABELS[state] ?? STATUS_LABELS.disconnected;
    },
  };
}

module.exports = { createStatusBar };
