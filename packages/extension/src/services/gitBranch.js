'use strict';

/**
 * @param {typeof import('vscode')} vscode
 * @returns {GitBranchService}
 */
function createGitBranchService(vscode) {
  return {
    async getCurrent() {
      try {
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (!gitExtension) return null;

        const git = gitExtension.isActive
          ? gitExtension.exports
          : await gitExtension.activate();

        const api = git.getAPI(1);
        const repo = api.repositories[0];
        return repo?.state?.HEAD?.name ?? null;
      } catch {
        return null;
      }
    },
  };
}

module.exports = { createGitBranchService };

/**
 * @typedef {{ getCurrent: () => Promise<string | null> }} GitBranchService
 */
