import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const nodeLib = {
  input: {
    compiler: 'src/compiler.js',
    messageformat: 'src/messageformat.js',
    'compile-module': 'src/compile-module.js'
  },
  output: { dir: 'lib/', format: 'cjs' },
  external: [
    './compiler',
    'make-plural/cardinals',
    'make-plural/pluralCategories',
    'make-plural/plurals',
    // bundling messageformat-number-skeleton
    'messageformat-parser',
    'messageformat-runtime',
    'messageformat-runtime/lib/formatters',
    'safe-identifier'
  ],
  plugins: [resolve(), babel()]
};

const browserTargets = '> 0.5%, last 2 versions, Firefox ESR, not dead';
const browserBundle = {
  input: 'src/messageformat.js',
  output: {
    file: 'messageformat.js',
    format: 'umd',
    name: 'MessageFormat'
  },
  plugins: [
    resolve(),
    babel({ presets: [['@babel/preset-env', { targets: browserTargets }]] }),
    commonjs()
  ]
};

export default [nodeLib, browserBundle];
