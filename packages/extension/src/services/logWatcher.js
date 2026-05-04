'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const STORAGE_BASE = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Code',
  'User',
  'workspaceStorage'
);

/**
 * @param {{ vscode: typeof import('vscode'), idleSeconds: number, onIdle: () => void }} opts
 */
function createLogWatcher({ idleSeconds, onIdle }) {
  let watcher = null;
  let idleTimer = null;
  let lastMtime = 0;
  let watchedFile = null;

  function findLogFile() {
    try {
      const entries = fs.readdirSync(STORAGE_BASE, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const logDir = path.join(STORAGE_BASE, entry.name, 'GitHub.copilot-chat', 'debug-logs');
        if (!fs.existsSync(logDir)) continue;

        const sessions = fs.readdirSync(logDir, { withFileTypes: true });
        for (const sess of sessions) {
          if (!sess.isDirectory()) continue;
          const logFile = path.join(logDir, sess.name, 'main.jsonl');
          if (fs.existsSync(logFile)) return logFile;
        }
      }
    } catch {
      // storage not accessible
    }
    return null;
  }

  function scheduleIdleCheck() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!watchedFile) return;
      try {
        const stat = fs.statSync(watchedFile);
        const ageSecs = (Date.now() - stat.mtimeMs) / 1000;
        if (ageSecs >= idleSeconds && stat.mtimeMs !== lastMtime) {
          lastMtime = stat.mtimeMs;
          onIdle();
        }
      } catch {
        // file gone
      }
      scheduleIdleCheck();
    }, idleSeconds * 1000);
  }

  return {
    start() {
      watchedFile = findLogFile();
      if (!watchedFile) return;

      watcher = fs.watch(watchedFile, () => {
        scheduleIdleCheck();
      });

      scheduleIdleCheck();
    },

    stop() {
      clearTimeout(idleTimer);
      watcher?.close();
    },
  };
}

module.exports = { createLogWatcher };
