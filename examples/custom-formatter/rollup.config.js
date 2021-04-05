import alias from '@rollup/plugin-alias';
import messageformat from 'rollup-plugin-messageformat';
import { number } from './number';

export default {
  input: 'src/main.js',
  output: { dir: 'dist' },
  plugins: [
    alias({ entries: { '@number': './number.js' } }),
    messageformat({
      customFormatters: {
        number: {
          formatter: number,
          arg: 'options',
          id: 'number',
          module: '@number'
        }
      },
      locales: ['en']
    })
  ]
};
