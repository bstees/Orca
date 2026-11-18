const expoPreset = require('jest-expo/jest-preset');

// NOTE: process.env changes here run in the main jest process only — workers
// do not inherit them.  All pre-test globals must be set via setupFiles below.

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // Specifying setupFiles replaces the preset's list, so we re-include the
  // preset's current setup files, then prepend our bootstrap.
  setupFiles: [
    // Bootstrap: sets global.nativeModuleProxy so NativeModules.js never
    // checks __fbBatchedBridgeConfig.
    '<rootDir>/src/__mocks__/jestSetup.js',
    // Preserve React Native and Expo setup from the installed preset.
    ...expoPreset.setupFiles,
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|react-native-svg))',
  ],
  moduleNameMapper: {
    ...expoPreset.moduleNameMapper,
    // Resolve one mobile React runtime and its matching renderer, regardless of hoisting.
    '^react$': require.resolve('react'),
    '^react/jsx-runtime$': require.resolve('react/jsx-runtime'),
    '^react/jsx-dev-runtime$': require.resolve('react/jsx-dev-runtime'),
    '^react-test-renderer$': require.resolve('react-test-renderer'),
    // expo-notifications loads native modules — use a stub
    '^expo-notifications$': '<rootDir>/src/__mocks__/expoNotifications.js',
    // expo-linear-gradient loads native modules — use a stub
    '^expo-linear-gradient$': '<rootDir>/src/__mocks__/expoLinearGradient.js',
  },
};
