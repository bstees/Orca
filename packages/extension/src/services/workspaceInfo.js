'use strict';

/**
 * @param {typeof import('vscode')} vscode
 * @returns {WorkspaceInfoService}
 */
function createWorkspaceInfoService(vscode) {
  return {
    getCurrent() {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders?.length) return null;
      return {
        name: vscode.workspace.name ?? folders[0].name,
        rootPath: folders[0].uri.fsPath,
        folders: folders.map((f) => f.uri.fsPath),
      };
    },
  };
}

module.exports = { createWorkspaceInfoService };

/**
 * @typedef {{ name: string, rootPath: string, folders: string[] } | null} WorkspaceInfo
 * @typedef {{ getCurrent: () => WorkspaceInfo }} WorkspaceInfoService
 */
