module.exports = {
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react/umd/react.development.js',
    '^react-dom$':
      '<rootDir>/node_modules/react-dom/umd/react-dom.development.js'
  },
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!@messageformat/react)']
};
