import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const nodeLib = {
  input: {
    compiler: 'src/compiler.ts',
    messageformat: 'src/messageformat.ts',
    'compile-module': 'src/compile-module.ts'
  },
  output: { dir: 'lib/', format: 'cjs' },
  external: [
    './compiler',
    'make-plural/cardinals',
    'make-plural/pluralCategories',
    'make-plural/plurals',
    // bundling messageformat-date-skeleton
    // bundling messageformat-number-skeleton
    'messageformat-parser',
    'messageformat-runtime',
    'messageformat-runtime/lib/formatters',
    'safe-identifier'
  ],
  plugins: [resolve(), typescript()]
};

const browserBundle = {
  input: 'src/messageformat.ts',
  output: {
    file: 'messageformat.js',
    format: 'umd',
    name: 'MessageFormat'
  },
  plugins: [resolve(), typescript({ target: 'ES5' }), commonjs()]
};

export default [nodeLib, browserBundle];
