'use strict';
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'extension',
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '^.+\\.js$': ['babel-jest', { rootMode: 'upward' }],
  },
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/__mocks__/vscode.js',
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/__mocks__/**',
    '!src/extension.js',
  ],
};
