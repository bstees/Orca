'use strict';
const path = require('node:path');
const { Tray, Menu, nativeImage, app } = require('electron');

/**
 * Creates the system tray icon and context menu.
 *
 * @param {{ onShow: () => void, onQuit: () => void }} handlers
 * @returns {{ tray: Electron.Tray, setStatus: (status: 'starting'|'running'|'error') => void }}
 */
function createTray({ onShow, onQuit }) {
  // Use a template image from assets, falling back to a generated icon in dev
  const iconPath = path.join(__dirname, '..', 'assets', 'trayIconTemplate.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) throw new Error('empty');
  } catch {
    // Fallback: 16x16 white circle encoded as a minimal PNG
    const fallback = nativeImage.createFromDataURL(FALLBACK_ICON_DATA_URL);
    icon = fallback;
  }

  const tray = new Tray(icon);
  tray.setToolTip('Orca');

  function buildMenu(status) {
    const label = {
      'starting…': 'starting…',
      running: '● running',
      external: '⇄ external server',
      error: '⚠ error',
    }[status] ?? status;
    return Menu.buildFromTemplate([
      { label: `Orca — ${label}`, enabled: false },
      { type: 'separator' },
      { label: 'Show Dashboard', click: onShow },
      { type: 'separator' },
      { label: 'Quit', click: onQuit },
    ]);
  }

  tray.setContextMenu(buildMenu('starting…'));
  tray.on('click', onShow); // single-click on macOS shows dashboard

  function setStatus(status) {
    const label = status === 'running' ? 'running' : status === 'error' ? '⚠ error' : 'starting…';
    tray.setContextMenu(buildMenu(label));
    tray.setToolTip(`Orca — ${label}`);
  }

  return { tray, setStatus };
}

// Minimal 16×16 white circle on transparent background as a data URL
// Generated once so the package has no hard asset dependency in dev
const FALLBACK_ICON_DATA_URL =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA' +
  'BmJLR0QA/wD/AP+gvaeTAAAAN0lEQVQ4y2NgGAWkAkYGBgYm' +
  'BgaG/1QyiGqGsKhiAKsagqoZwqKKAaxqCKpmCIsqBrCqIQAA' +
  'AP//AwAI/AL+hc2rNAAAAABJRU5ErkJggg==';

module.exports = { createTray };
