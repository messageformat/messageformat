import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  optimizeDeps: {
    include: [
      '@fluent/syntax',
      'fast-deep-equal',
      'intl-list-format',
      'intl-list-format/locale-data/en',
      'intl-list-format/locale-data/fi',
      'lodash.merge',
      'make-plural/pluralCategories',
      'make-plural/plurals',
      'moo',
      'react-test-renderer',
      'react',
      'safe-identifier',
      'saxes'
    ]
  },
  test: {
    browser: {
      // https://vitest.dev/config/browser/playwright
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [
        { browser: 'chromium' },
        { browser: 'firefox' }
        // { browser: 'webkit' }
      ]
    },
    exclude: [
      './mf1/examples/',
      './mf1/packages/core/src/compile-module.test.ts',
      './mf1/packages/rollup-plugin/',
      './mf1/packages/runtime/',
      './mf2/messageformat/src/spec.test.ts',
      './node_modules/'
    ]
  }
});
