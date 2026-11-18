// Bootstrap file — runs inside each jest worker before the RN / expo setup
// files run.
//
// 1. Set nativeModuleProxy early so NativeModules.js never tries to read
//    global.__fbBatchedBridgeConfig (which is only set in a real device env).
//    An empty-object proxy is enough: TurboModuleRegistry.get() returns null
//    for every module it looks up, which is fine for unit tests.
global.nativeModuleProxy = {};

// The Jest config resolves React and its matching renderer from this workspace.
// Keep RNTL's dependency compatibility check enabled.
