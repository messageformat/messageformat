import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    exclude: ['./mf1/examples/', './node_modules/']
  }
});
