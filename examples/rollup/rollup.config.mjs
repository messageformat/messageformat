import resolve from '@rollup/plugin-node-resolve';
import messageformat from 'rollup-plugin-messageformat';

export default {
  input: 'src/main.js',
  output: { dir: 'dist' },
  plugins: [resolve(), messageformat({ locales: ['en', 'fi'] })]
};
