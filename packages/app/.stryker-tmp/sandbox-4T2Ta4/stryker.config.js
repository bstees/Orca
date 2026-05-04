/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
// @ts-nocheck

export default {
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/utils/**/*.js',
    'src/hooks/**/*.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/index.js',
  ],
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  },
  reporters: [
    'html',
    'clear-text',
    'progress',
  ],
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
  timeoutMS: 30000,
  concurrency: 4,
  ignoreStatic: true,
};
