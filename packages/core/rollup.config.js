import babel from 'rollup-plugin-babel';
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
    '@messageformat/parser',
    '@messageformat/runtime',
    '@messageformat/runtime/lib/formatters',
    'safe-identifier'
  ],
  plugins: [resolve(), typescript()]
};

const browserTargets = '> 0.5%, last 2 versions, Firefox ESR, not dead';
const browserBundle = {
  input: 'src/messageformat.ts',
  output: {
    file: 'messageformat.js',
    format: 'umd',
    name: 'MessageFormat'
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      downlevelIteration: true,
      target: 'ES5'
    }),
    babel({ presets: [['@babel/preset-env', { targets: browserTargets }]] })
  ]
};

export default [nodeLib, browserBundle];
