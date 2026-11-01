// NOTE: process.env changes here run in the main jest process only — workers
// do not inherit them.  All pre-test globals must be set via setupFiles below.

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Specifying setupFiles replaces the preset's list, so we re-include the
  // preset's two files explicitly, then prepend our bootstrap.
  setupFiles: [
    // Bootstrap: sets global.nativeModuleProxy so NativeModules.js never
    // checks __fbBatchedBridgeConfig, and skips RNTL peer-dep version check.
    '<rootDir>/src/__mocks__/jestSetup.js',
    // React Native mock layer (mocks UIManager, NativeModules, etc.)
    require.resolve('react-native/jest/setup'),
    // Expo mock layer (adds expo-specific NativeModuleProxy mock, etc.)
    require.resolve('jest-expo/src/preset/setup'),
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|react-native-svg))',
  ],
  moduleNameMapper: {
    // Force a single React runtime — mobile/node_modules has a local copy
    // that diverges from the workspace root, breaking hook identity checks.
    '^react$': '<rootDir>/../../node_modules/react/index.js',
    '^react/jsx-runtime$': '<rootDir>/../../node_modules/react/jsx-runtime.js',
    '^react/jsx-dev-runtime$': '<rootDir>/../../node_modules/react/jsx-dev-runtime.js',
    '^react-test-renderer$': '<rootDir>/../../node_modules/react-test-renderer/index.js',
    // Force a single react-native runtime.
    // @testing-library/react-native lives at the workspace root, so its
    // require('react-native') resolves to the ROOT node_modules copy while
    // SessionCard resolves to packages/mobile/node_modules. Jest treats these
    // as DIFFERENT modules — mocks only cover the mobile-local copy. Pin every
    // react-native require to the same mobile-local path so the NativeModules
    // mock registered by react-native/jest/setup.js applies everywhere.
    '^react-native$': '<rootDir>/node_modules/react-native/index.js',
    '^react-native/(.+)$': '<rootDir>/node_modules/react-native/$1',
    // expo-notifications loads native modules — use a stub
    '^expo-notifications$': '<rootDir>/src/__mocks__/expoNotifications.js',
    // expo-linear-gradient loads native modules — use a stub
    '^expo-linear-gradient$': '<rootDir>/src/__mocks__/expoLinearGradient.js',
  },
};
