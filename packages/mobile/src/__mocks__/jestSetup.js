// Bootstrap file — runs inside each jest worker before the RN / expo setup
// files run.
//
// 1. Set nativeModuleProxy early so NativeModules.js never tries to read
//    global.__fbBatchedBridgeConfig (which is only set in a real device env).
//    An empty-object proxy is enough: TurboModuleRegistry.get() returns null
//    for every module it looks up, which is fine for unit tests.
global.nativeModuleProxy = {};

// 2. Bypass RNTL v13's peer-dep version check.  Our yarn workspace has both a
//    local react copy in packages/mobile/node_modules and the canonical copy
//    at the workspace root; the two copies differ only in patch (19.2.5 vs
//    19.2.6), so the React singleton is the same object at runtime, but the
//    version strings make RNTL's ensurePeerDeps() complain.
process.env.RNTL_SKIP_DEPS_CHECK = '1';
