#!/usr/bin/env node
'use strict';
/**
 * Rebuilds better-sqlite3 for Electron WITHOUT touching the shared
 * node_modules binary that system-Node (Jest) depends on.
 *
 * Strategy:
 *   1. Copy better-sqlite3's build directory to packages/desktop/.native-electron/
 *   2. Run electron-rebuild targeting that directory
 *   3. Electron main process resolves the patched binary via BETTER_SQLITE3_BINDING env var
 *
 * This way Jest always sees the system-Node binary and Electron always gets
 * the Electron-Node binary.
 */

const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..', '..');           // monorepo root
const SHARED_BUILD = path.join(ROOT, 'node_modules', 'better-sqlite3', 'build', 'Release');
const ELECTRON_BUILD_DIR = path.join(__dirname, '..', '.native-electron');
const ELECTRON_BUILD = path.join(ELECTRON_BUILD_DIR, 'Release');
const MARKER = path.join(ELECTRON_BUILD_DIR, '.electron-version');

// Get current Electron version from node_modules
let electronVersion;
try {
  const epkg = require(path.join(ROOT, 'node_modules', 'electron', 'package.json'));
  electronVersion = epkg.version;
} catch {
  // Fall back to package.json devDependency spec
  electronVersion = require(path.join(__dirname, '..', 'package.json')).devDependencies.electron.replace(/\^|~/, '');
}

// Skip rebuild if already built for this exact Electron version
if (
  fs.existsSync(MARKER) &&
  fs.readFileSync(MARKER, 'utf8').trim() === electronVersion &&
  fs.existsSync(path.join(ELECTRON_BUILD, 'better_sqlite3.node'))
) {
  console.log(`[rebuild-native] already built for Electron ${electronVersion} — skipping.`);
  process.exit(0);
}

console.log(`[rebuild-native] Building better-sqlite3 for Electron ${electronVersion}…`);

// Write a sentinel package.json so electron-rebuild finds the module
fs.mkdirSync(ELECTRON_BUILD_DIR, { recursive: true });
fs.writeFileSync(
  path.join(ELECTRON_BUILD_DIR, 'package.json'),
  JSON.stringify({ name: 'better-sqlite3-electron', version: '1.0.0' })
);

const electronRebuild = path.join(ROOT, 'node_modules', '.bin', 'electron-rebuild');
execSync(
  `${electronRebuild} -f -w better-sqlite3 --module-dir "${path.join(ROOT, 'node_modules', 'better-sqlite3')}" --electron-version ${electronVersion}`,
  { stdio: 'inherit', cwd: ROOT }
);

// Copy the freshly built binary to our private dir
fs.mkdirSync(ELECTRON_BUILD, { recursive: true });
for (const f of fs.readdirSync(SHARED_BUILD)) {
  fs.copyFileSync(path.join(SHARED_BUILD, f), path.join(ELECTRON_BUILD, f));
}

// Restore the shared build for system Node so Jest still works
execSync('npm rebuild better-sqlite3', { stdio: 'inherit', cwd: ROOT });

fs.writeFileSync(MARKER, electronVersion);
console.log(`[rebuild-native] Done. Binary saved to ${path.relative(ROOT, ELECTRON_BUILD)}`);
