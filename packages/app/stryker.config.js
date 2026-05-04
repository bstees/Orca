import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/utils/**/*.js',
    'src/hooks/**/*.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/index.js',
    '!src/hooks/useOrcaSocket.js',
  ],
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
    config: {
      moduleNameMapper: {
        '^@orca/shared$': join(__dirname, '../shared/src/index.js'),
      },
    },
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
