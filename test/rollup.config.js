import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/ie11-polyfills.js',
    output: { file: 'browser/dist/ie11-polyfills.js', format: 'iife' },
    plugins: [resolve(), commonjs()]
  },
  {
    input: 'src/browser-tests.ts',
    output: {
      file: 'browser/dist/browser-tests.js',
      format: 'iife',
      globals: { chai: 'chai', messageformat: 'MessageFormat' }
    },
    external: ['chai', 'messageformat'],
    plugins: [typescript({ target: 'ES5' })]
  }
];
