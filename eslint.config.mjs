import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/dist/',
      '**/node_modules/',
      '**/package.json',
      '**/package-lock.json',
      'coverage/',
      'docs/',
      'mf1/examples/cli/*.mjs',
      'mf1/examples/react/',
      'mf1/packages/core/lib/*',
      'mf1/packages/core/messageformat.*',
      'mf1/packages/date-skeleton/lib/*',
      'mf1/packages/number-skeleton/lib/*',
      'mf1/packages/parser/lib/*',
      'mf1/packages/react/lib/*',
      'mf1/packages/react/src/__fixtures__/*',
      'mf1/packages/rollup-plugin/lib/*',
      'mf1/packages/runtime/esm/*',
      'mf1/packages/runtime/lib/*',
      'mf2/*/lib/*',
      'test/messageformat-wg/',
      'tmp/'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 2018,
      sourceType: 'module'
    },

    rules: {
      'array-callback-return': 'error',
      camelcase: 'off',
      'consistent-return': 'error',
      curly: ['warn', 'multi-line', 'consistent'],
      eqeqeq: ['error', 'smart'],
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-implicit-globals': 'error',
      'no-useless-rename': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'sort-imports': ['warn', { ignoreDeclarationSort: true }]
    }
  },
  {
    files: ['**/*.js'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['mf2/**/*.ts'],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  },
  {
    files: ['test/browser/tests/*.js'],
    languageOptions: { globals: { ...globals.mocha } }
  },
  {
    files: ['**/*.test.{mts,ts,tsx}', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];
