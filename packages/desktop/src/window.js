'use strict';
const path = require('node:path');
const { BrowserWindow, shell, app } = require('electron');

const DASHBOARD_DEV_URL = `http://127.0.0.1:${process.env.VITE_PORT ?? '5173'}`;

function getDashboardDistPath() {
  // In packaged app, extraResources land in process.resourcesPath
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app-dist', 'index.html');
  }
  return path.join(__dirname, '..', '..', 'app', 'dist', 'index.html');
}

/**
 * Creates (or focuses) the dashboard BrowserWindow.
 *
 * In dev mode (ORCA_DEV=1) the window loads the Vite dev server URL.
 * In production it loads the built app/dist/index.html served by the
 * embedded Fastify static plugin on http://127.0.0.1:<port>.
 *
 * @param {{ serverPort: number }} opts
 * @returns {{ show: () => void, hide: () => void, window: BrowserWindow }}
 */
function createDashboardWindow({ serverPort }) {
  let win = null;

  function getOrCreate() {
    if (win && !win.isDestroyed()) return win;

    win = new BrowserWindow({
      width: 1100,
      height: 700,
      minWidth: 800,
      minHeight: 500,
      title: 'Orca Dashboard',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      show: false,
    });

    const isDev = process.env.ORCA_DEV === '1';
    const url = isDev
      ? DASHBOARD_DEV_URL
      : `http://127.0.0.1:${serverPort}/`;

    win.loadURL(url);

    // Open DevTools for diagnosing packaged-app issues.
    // TODO: remove or gate on env var once stable.
    win.webContents.openDevTools({ mode: 'detach' });

    win.once('ready-to-show', () => win.show());

    // Open external links in the OS browser, not in the app window
    win.webContents.setWindowOpenHandler(({ url: href }) => {
      shell.openExternal(href);
      return { action: 'deny' };
    });

    win.on('closed', () => { win = null; });

    return win;
  }

  return {
    show() {
      const w = getOrCreate();
      if (w.isMinimized()) w.restore();
      w.focus();
    },
    hide() {
      win?.hide();
    },
    get window() { return win; },
  };
}

module.exports = { createDashboardWindow };
