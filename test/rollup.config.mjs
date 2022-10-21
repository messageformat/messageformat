import typescript from '@rollup/plugin-typescript';

export default {
  input: 'browser/src/browser-tests.ts',
  output: {
    file: 'browser/dist/browser-tests.js',
    format: 'iife',
    globals: { chai: 'chai', '@messageformat/core': 'MessageFormat' }
  },
  external: ['chai', '@messageformat/core'],
  plugins: [typescript({ target: 'ES2017' })]
};
