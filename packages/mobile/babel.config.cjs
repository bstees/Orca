module.exports = function (api) {
  const isTest = api.env('test');
  return {
    presets: [
      ['babel-preset-expo', {
        // Disable import.meta transform in Jest — the lazy globalThis.__ExpoImportMetaRegistry
        // accessor triggers jest-runtime outside of test scope and throws a ReferenceError.
        importMeta: false,
        // Use classic JSX runtime so React doesn't need to be in scope
        jsxRuntime: 'automatic',
        // Don't inline native modules manifest during testing
        ...(isTest ? { unstable_transformProfile: 'hermes-stable' } : {}),
      }],
    ],
  };
};
