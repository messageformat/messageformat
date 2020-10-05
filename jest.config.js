const { defaults } = require('jest-config');

module.exports = {
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/fixtures/',
    '/parser/parser.js'
  ],
  moduleFileExtensions: ['mjs', ...defaults.moduleFileExtensions],
  moduleNameMapper: {
    '^@messageformat/core$': '<rootDir>/packages/core/src/messageformat.ts',
    '^@messageformat/core/compile-module$':
      '<rootDir>/packages/core/src/compile-module.ts',
    '^@messageformat/parser$': '<rootDir>/packages/parser/src/parser.ts',
    '^@messageformat/runtime$': '<rootDir>/packages/runtime/src/runtime.ts',
    '^@messageformat/runtime/lib/(.*)$': '<rootDir>/packages/runtime/src/$1.ts'
  },
  resolver: 'jest-ts-webcompat-resolver',
  transform: { '\\.(js|mjs|ts)$': 'babel-jest' },
  transformIgnorePatterns: [
    '/node_modules/(?!make-plural|messageformat-(date|number)-skeleton)'
  ]
};
