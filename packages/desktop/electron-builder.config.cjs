'use strict';
const path = require('node:path');

/**
 * electron-builder configuration.
 *
 * Packaging flow:
 *   1. `prebuild` script: bundles server→src/server.bundle.cjs, generates icons
 *   2. electron-builder copies files into the asar
 *   3. afterPack hook: rebuilds better-sqlite3 .node for the packaged Electron ABI
 *      and places it alongside the asar so the app can find it at runtime
 *   4. Produces: dist-electron/Orca-<ver>-mac.dmg  (drag-to-Applications)
 */
module.exports = {
  appId: 'com.orca.desktop',
  productName: 'Orca',
  copyright: `Copyright © ${new Date().getFullYear()} Orca contributors`,

  directories: {
    output: 'dist-electron',
    buildResources: 'assets',
  },

  // ── What goes inside the asar ──────────────────────────────────────────
  files: [
    'src/**/*',
    '!src/**/*.test.js',
    '!src/server.bundle.cjs',  // too large for asar — use extraResources
  ],

  // Files placed in Contents/Resources/ alongside the asar
  extraResources: [
    // Pre-built dashboard
    { from: '../app/dist', to: 'app-dist' },
    // Pre-bundled server (3 MB — faster load outside asar)
    { from: 'src/server.bundle.cjs', to: 'server.bundle.cjs' },
  ],

  // better-sqlite3 .node lives outside the asar (native modules can't be inside)
  asarUnpack: [
    '**/better_sqlite3.node',
    '**/*.node',
  ],

  // ── macOS DMG ─────────────────────────────────────────────────────────
  mac: {
    category: 'public.app-category.developer-tools',
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },
      { target: 'zip', arch: ['arm64', 'x64'] },
    ],
    icon: 'assets/icon.icns',
    darkModeSupport: true,
    hardenedRuntime: false,   // set true + entitlements when code-signing
    gatekeeperAssess: false,
  },

  dmg: {
    title: 'Orca ${version}',
    window: { width: 540, height: 380 },
    iconSize: 120,
    contents: [
      { x: 175, y: 220, type: 'file' },           // app icon
      { x: 365, y: 220, type: 'link', path: '/Applications' },  // Applications shortcut
    ],
  },

  // ── Windows NSIS installer ─────────────────────────────────────────────
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'assets/icon.ico',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Orca',
  },

  // ── Linux AppImage ─────────────────────────────────────────────────────
  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    icon: 'assets/icon.png',
    category: 'Development',
    desktop: {
      entry: {
        Name: 'Orca',
        Comment: 'AI workstream orchestration dashboard',
      },
    },
  },
};
