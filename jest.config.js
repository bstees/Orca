/** @type {import('jest').Config} */
export default {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'html',
    'text',
    'text-summary',
  ],
  projects: [
    '<rootDir>/packages/shared',
    '<rootDir>/packages/server',
    '<rootDir>/packages/app',
    '<rootDir>/packages/extension',
  ],
};
