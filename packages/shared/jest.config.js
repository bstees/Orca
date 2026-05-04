/** @type {import('jest').Config} */
export default {
  displayName: 'shared',
  clearMocks: true,
  resetModules: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js',
  ],
};
