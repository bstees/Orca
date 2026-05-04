/** @type {import('jest').Config} */
export default {
  displayName: 'server',
  clearMocks: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  moduleNameMapper: {
    '^@orca/shared$': '<rootDir>/../shared/src/index.js',
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js',
  ],
};
