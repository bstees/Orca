import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const skylineRules = {
  'no-console': ['error'],
  'max-len': [
    'error',
    {
      code: 150,
      ignoreTrailingComments: true,
      ignoreUrls: true,
    },
  ],
  indent: [
    'error',
    2,
    { SwitchCase: 1 },
  ],
  'object-curly-newline': [
    'error',
    {
      consistent: true,
      minProperties: 3,
    },
  ],
  'object-property-newline': ['error', { allowMultiplePropertiesPerLine: true }],
  'array-bracket-newline': [
    'error',
    {
      multiline: true,
      minItems: 3,
    },
  ],
  'array-element-newline': [
    'error',
    {
      multiline: true,
      minItems: 3,
    },
  ],
  'comma-dangle': [
    'error',
    {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    },
  ],
  'comma-style': ['error', 'last'],
  semi: ['error', 'always'],
  quotes: [
    'error',
    'single',
    { avoidEscape: true, allowTemplateLiterals: true },
  ],
  'arrow-parens': ['error', 'always'],
};

export default [
  {
    // Server and shared — Node.js environment, no React
    files: ['packages/server/**/*.js', 'packages/shared/**/*.js', 'scripts/**/*.js'],
    ignores: ['**/node_modules/**', '**/dist/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      ...eslintConfigPrettier.rules,
      ...js.configs.recommended.rules,
      ...skylineRules,
    },
  },
  {
    // App and extension — React + browser environment
    files: ['packages/app/**/*.{js,jsx}', 'packages/extension/**/*.js'],
    ignores: ['**/node_modules/**', '**/dist/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: '19' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...eslintConfigPrettier.rules,
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...skylineRules,
    },
  },
];
