'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/**
 * Build the directory structure createLogWatcher expects under a given base:
 *   <base>/Library/Application Support/Code/User/workspaceStorage
 *          /<wsHash>/GitHub.copilot-chat/debug-logs/<sessId>/main.jsonl
 *
 * Returns the path to main.jsonl.
 */
function buildLogTree(base, { mtime } = {}) {
  const storageDir = path.join(
    base,
    'Library', 'Application Support', 'Code', 'User', 'workspaceStorage',
    'ws-hash', 'GitHub.copilot-chat', 'debug-logs', 'sess-id'
  );
  fs.mkdirSync(storageDir, { recursive: true });
  const logFile = path.join(storageDir, 'main.jsonl');
  fs.writeFileSync(logFile, '');
  if (mtime !== undefined) {
    const t = mtime / 1000;
    fs.utimesSync(logFile, t, t);
  }
  return logFile;
}

describe('createLogWatcher', () => {
  it('returns start and stop methods', () => {
    jest.resetModules();
    const { createLogWatcher } = require('./logWatcher.js');
    const w = createLogWatcher({ idleSeconds: 5, onIdle: jest.fn() });
    expect(typeof w.start).toBe('function');
    expect(typeof w.stop).toBe('function');
  });

  it('stop() is a no-op when not started', () => {
    jest.resetModules();
    const { createLogWatcher } = require('./logWatcher.js');
    const w = createLogWatcher({ idleSeconds: 5, onIdle: jest.fn() });
    expect(() => w.stop()).not.toThrow();
  });

  it('stop() is idempotent', () => {
    jest.resetModules();
    const { createLogWatcher } = require('./logWatcher.js');
    const w = createLogWatcher({ idleSeconds: 5, onIdle: jest.fn() });
    w.stop();
    expect(() => w.stop()).not.toThrow();
  });
});

describe('createLogWatcher idle detection', () => {
  let tmpDir;

  beforeEach(() => {
    jest.useFakeTimers();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orca-idle-'));
    jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fires onIdle when log file mtime is older than idleSeconds', () => {
    const onIdle = jest.fn();
    const idleSeconds = 5;
    buildLogTree(tmpDir, { mtime: Date.now() - 10_000 }); // 10s ago

    jest.resetModules();
    const { createLogWatcher } = require('./logWatcher.js');
    const watcher = createLogWatcher({ idleSeconds, onIdle });
    watcher.start();

    jest.advanceTimersByTime(idleSeconds * 1000 + 100);

    expect(onIdle).toHaveBeenCalledTimes(1);
    watcher.stop();
  });

  it('does not fire onIdle when log file was recently modified', () => {
    const onIdle = jest.fn();
    const idleSeconds = 5;
    buildLogTree(tmpDir); // default mtime = now

    jest.resetModules();
    const { createLogWatcher } = require('./logWatcher.js');
    const watcher = createLogWatcher({ idleSeconds, onIdle });
    watcher.start();

    jest.advanceTimersByTime(idleSeconds * 1000 + 100);

    expect(onIdle).not.toHaveBeenCalled();
    watcher.stop();
  });

  it('does not fire onIdle twice for the same mtime', () => {
    const onIdle = jest.fn();
    const idleSeconds = 5;
    buildLogTree(tmpDir, { mtime: Date.now() - 10_000 });

    jest.resetModules();
    const { createLogWatcher } = require('./logWatcher.js');
    const watcher = createLogWatcher({ idleSeconds, onIdle });
    watcher.start();

    // Advance twice the interval — the same stale mtime, so onIdle fires once
    jest.advanceTimersByTime(idleSeconds * 1000 * 2 + 200);

    expect(onIdle).toHaveBeenCalledTimes(1);
    watcher.stop();
  });

  it('does not fire onIdle when no log file is found', () => {
    const onIdle = jest.fn();
    // No log tree built — storageBase exists but is empty

    jest.resetModules();
    const { createLogWatcher } = require('./logWatcher.js');
    const watcher = createLogWatcher({ idleSeconds: 5, onIdle });
    watcher.start(); // findLogFile returns null → early return

    jest.advanceTimersByTime(10_000);
    expect(onIdle).not.toHaveBeenCalled();
    watcher.stop();
  });
});

