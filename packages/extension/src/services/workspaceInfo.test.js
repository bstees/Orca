'use strict';
const vscode = require('vscode');
const { createWorkspaceInfoService } = require('./workspaceInfo.js');

describe('createWorkspaceInfoService', () => {
  it('returns name and rootPath from workspace', () => {
    const svc = createWorkspaceInfoService(vscode);
    const info = svc.getCurrent();
    expect(info).not.toBeNull();
    expect(info.name).toBe('mock-workspace');
    expect(info.rootPath).toBe('/mock/workspace');
  });

  it('returns all folder paths', () => {
    const svc = createWorkspaceInfoService(vscode);
    const info = svc.getCurrent();
    expect(Array.isArray(info.folders)).toBe(true);
    expect(info.folders).toContain('/mock/workspace');
  });

  it('returns null when no workspace folders are open', () => {
    const savedFolders = vscode.workspace.workspaceFolders;
    vscode.workspace.workspaceFolders = null;

    const svc = createWorkspaceInfoService(vscode);
    expect(svc.getCurrent()).toBeNull();

    vscode.workspace.workspaceFolders = savedFolders;
  });

  it('falls back to first folder name when workspace.name is undefined', () => {
    const savedName = vscode.workspace.name;
    vscode.workspace.name = undefined;

    const svc = createWorkspaceInfoService(vscode);
    const info = svc.getCurrent();
    expect(info.name).toBe('mock-workspace'); // from folders[0].name

    vscode.workspace.name = savedName;
  });
});
