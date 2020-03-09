import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  output: { format: 'cjs' },
  external: [
    'messageformat-parser',
    'messageformat-runtime',
    'messageformat-runtime/lib/formatters',
    'safe-identifier'
  ],
  plugins: [resolve(), babel()]
};
