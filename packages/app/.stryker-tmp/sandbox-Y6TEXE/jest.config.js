/** @type {import('jest').Config} */
// @ts-nocheck

export default {
  displayName: 'app',
  clearMocks: true,
  resetModules: true,
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { rootMode: 'upward' }],
    '.+\\.(css|styl|less|sass|scss)$': 'jest-css-modules-transform',
  },
  moduleNameMapper: {
    '^@orca/shared$': '<rootDir>/../shared/src/index.js',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/index.js',
    '!src/**/*.stories.{js,jsx}',
    '!src/main.jsx',
    '!src/demo/**',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.stories\\.(js|jsx)$',
  ],
};
