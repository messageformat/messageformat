const { defaults } = require('jest-config');

module.exports = {
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/fixtures/',
    '/__fixtures__/',
    '/parser/parser.js'
  ],
  moduleFileExtensions: ['mjs', ...defaults.moduleFileExtensions],
  moduleNameMapper: {
    '^@messageformat/core$': '<rootDir>/packages/core/src/messageformat.ts',
    '^@messageformat/core/compile-module$':
      '<rootDir>/packages/core/src/compile-module.ts',
    '^@messageformat/date-skeleton$':
      '<rootDir>/packages/date-skeleton/src/index.ts',
    '^@messageformat/number-skeleton$':
      '<rootDir>/packages/number-skeleton/src/index.ts',
    '^@messageformat/parser$': '<rootDir>/packages/parser/src/parser.ts',
    '^@messageformat/react$': '<rootDir>/packages/react/src/index.ts',
    '^@messageformat/runtime$': '<rootDir>/packages/runtime/src/runtime.ts',
    '^@messageformat/runtime/lib/(.*)$': '<rootDir>/packages/runtime/src/$1.ts'
  },
  resolver: 'jest-ts-webcompat-resolver',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/examples/react/'],
  transform: { '\\.(js|mjs|ts|tsx)$': 'babel-jest' },
  transformIgnorePatterns: [
    '/node_modules/(?!make-plural|messageformat-(date|number)-skeleton)'
  ]
};
