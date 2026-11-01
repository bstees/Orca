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

        // If no repositories are open yet, wait up to 3 s for the first one.
        if (!api.repositories.length) {
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 3000);
            const listener = api.onDidOpenRepository(() => {
              clearTimeout(timeout);
              listener.dispose();
              resolve();
            });
          });
        }

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
