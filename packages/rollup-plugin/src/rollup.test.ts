import { resolve } from 'path';
import { rollup } from 'rollup';
import plugin from './index';

// rollup-plugin-messageformat requires Node.js 14 or later
if (process.version < 'v14.') test = test.skip;

const external = /^@messageformat\/runtime\b/;
const fixtures = resolve(__dirname, '__fixtures__');

test('YAML with default import', async () => {
  const bundle = await rollup({
    external,
    input: resolve(fixtures, 'yaml-default.js'),
    plugins: [plugin({ locales: ['en', 'fi'] })]
  });
  const { output } = await bundle.generate({ format: 'es' });
  expect(output).toMatchObject([{ fileName: 'yaml-default.js' }]);
  expect(output[0].code).toMatchSnapshot();
});

test('YAML with named import', async () => {
  const bundle = await rollup({
    external,
    input: resolve(fixtures, 'yaml-named.js'),
    plugins: [plugin({ locales: ['en', 'fi'] })]
  });
  const { output } = await bundle.generate({ format: 'es' });
  expect(output).toMatchObject([{ fileName: 'yaml-named.js' }]);
  expect(output[0].code).toMatchSnapshot();
});

test('.properties with Latin-1 encoding', async () => {
  const bundle = await rollup({
    external,
    input: resolve(fixtures, 'properties.js'),
    plugins: [plugin({ locales: ['en', 'fi'] })]
  });
  const { output } = await bundle.generate({ format: 'es' });
  expect(output).toMatchObject([{ fileName: 'properties.js' }]);
  expect(output[0].code).toMatchSnapshot();
});

test('README sample', async () => {
  const bundle = await rollup({
    external,
    input: resolve(fixtures, 'readme-sample.js'),
    plugins: [plugin({ locales: ['en', 'fr'] })]
  });
  const { output } = await bundle.generate({ format: 'es' });
  expect(output).toMatchObject([{ fileName: 'readme-sample.js' }]);
  expect(output[0].code).toMatchSnapshot();
});
