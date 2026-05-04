'use strict';
const path = require('node:path');
const fs = require('node:fs');

// Point better-sqlite3 at the Electron-native binary BEFORE any require().
// This ensures Electron gets the binary compiled for its Node ABI,
// while Jest (system Node) continues to use the standard build.
const nativeBinaryDev = path.join(__dirname, '..', '.native-electron', 'Release', 'better_sqlite3.node');
// In packaged app, asarUnpack puts .node files under app.asar.unpacked
const nativeBinaryPkg = path.join(
  path.dirname(process.execPath),
  '..', 'Resources', 'app.asar.unpacked', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'
);
const nativeBinary = fs.existsSync(nativeBinaryDev) ? nativeBinaryDev : nativeBinaryPkg;
if (fs.existsSync(nativeBinary)) {
  process.env.BETTER_SQLITE3_BINDING = nativeBinary;
}

const { app, dialog, nativeImage } = require('electron');
const { createServerBridge } = require('./server-bridge');
const { createTray } = require('./tray');
const { createDashboardWindow } = require('./window');

// ── Dock / taskbar icon ─────────────────────────────────────────────────────
const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
const appIcon = nativeImage.createFromPath(iconPath);
if (!appIcon.isEmpty()) {
  // macOS dock icon; on Windows/Linux this sets the taskbar icon
  if (app.dock) app.dock.setIcon(appIcon);
}

// Prevent the app from quitting when all windows are closed (stays in tray)
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') e.preventDefault?.();
});

app.whenReady().then(async () => {
  let serverPort = null;
  let dashboard = null;

  // ── Server ─────────────────────────────────────────────────────────────
  const serverBridge = createServerBridge();

  // ── Tray ────────────────────────────────────────────────────────────────
  const { tray, setStatus } = createTray({
    onShow: () => dashboard?.show(),
    onQuit: () => {
      app.quit();
    },
  });

  // ── Start server ────────────────────────────────────────────────────────
  try {
    const result = await serverBridge.start();
    serverPort = result.port;
    setStatus(result.external ? 'external' : 'running');
  } catch (err) {
    setStatus('error');
    dialog.showErrorBox(
      'Orca — server failed to start',
      `Could not bind to port ${process.env.ORCA_PORT ?? 7337}.\n\n${err.message}`
    );
    app.quit();
    return;
  }

  // ── Dashboard window ────────────────────────────────────────────────────
  dashboard = createDashboardWindow({ serverPort });
  dashboard.show();

  // On macOS, clicking the dock icon re-opens the window
  app.on('activate', () => dashboard.show());

  // ── Cleanup ─────────────────────────────────────────────────────────────
  app.on('before-quit', async () => {
    tray.destroy();
    await serverBridge.stop();
  });
});
