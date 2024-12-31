const { defaults } = require('jest-config');

module.exports = {
  collectCoverage: false,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/fixtures/',
    '/__fixtures__/',
    '/parser/parser.js'
  ],
  moduleFileExtensions: ['mjs', ...defaults.moduleFileExtensions],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
    '^messageformat$': '<rootDir>/mf2/messageformat/src/index.ts',
    '^messageformat/functions$':
      '<rootDir>/mf2/messageformat/src/functions/index.ts',
    '^messageformat/functions/utils$':
      '<rootDir>/mf2/messageformat/src/functions/utils.ts',
    '^@messageformat/core$': '<rootDir>/mf1/packages/core/src/messageformat.ts',
    '^@messageformat/core/compile-module$':
      '<rootDir>/mf1/packages/core/src/compile-module.ts',
    '^@messageformat/date-skeleton$':
      '<rootDir>/mf1/packages/date-skeleton/src/index.ts',
    '^@messageformat/fluent$': '<rootDir>/mf2/fluent/src/index.ts',
    '^@messageformat/icu-messageformat-1$':
      '<rootDir>/mf2/icu-messageformat-1/src/index.ts',
    '^@messageformat/number-skeleton$':
      '<rootDir>/mf1/packages/number-skeleton/src/index.ts',
    '^@messageformat/parser$': '<rootDir>/mf1/packages/parser/src/parser.ts',
    '^@messageformat/react$': '<rootDir>/mf1/packages/react/src/index.ts',
    '^@messageformat/runtime$': '<rootDir>/mf1/packages/runtime/src/runtime.ts',
    '^@messageformat/runtime/lib/(.*)$':
      '<rootDir>/mf1/packages/runtime/src/$1.ts'
  },
  resolver: 'jest-ts-webcompat-resolver',
  testPathIgnorePatterns: [
    '<rootDir>/mf1/examples/react/',
    '/node_modules/',
    '/deno.test.ts$'
  ],
  transform: { '\\.(js|mjs|ts|tsx)$': 'babel-jest' },
  transformIgnorePatterns: [
    '/node_modules/(?!make-plural|messageformat-(date|number)-skeleton)'
  ]
};
