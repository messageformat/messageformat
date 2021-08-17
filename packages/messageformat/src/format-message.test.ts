// @ts-ignore
import { source } from 'common-tags';
import { compileFluent } from '@messageformat/compiler';

import { MessageFormat, Runtime } from './index';
import { FormattedDynamic } from './format-message';

describe('Function returns primitive value', () => {
  test('string', () => {
    const src = source`
      msg = { STRINGIFY($var) }
    `;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      format: { STRINGIFY: (_lc, _opt, arg) => String(arg) },
      select: {}
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg', { var: 42 })).toMatchObject([
      { type: 'dynamic', value: '42' }
    ]);
    expect(mf.format('msg', { var: 42 })).toBe('42');
  });

  test('number', () => {
    const src = `msg = { NUMERIC($var) }\n`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime<number> = {
      format: { NUMERIC: (_lc, _opt, arg) => Number(arg) },
      select: {}
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg', { var: '42' })).toMatchObject([
      { type: 'dynamic', value: 42 }
    ]);
    expect(mf.format('msg', { var: '42' })).toBe('42');
  });
});

describe('Function returns Formatted value', () => {
  test('with meta value', () => {
    const src = `msg = { STRINGIFY($var) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      format: {
        STRINGIFY: (_lc, _opt, arg: string) =>
          new FormattedDynamic(['en'], String(arg), { foo: 'FOO' })
      },
      select: {}
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg', { var: 42 })).toMatchObject([
      { type: 'dynamic', value: '42', meta: { foo: 'FOO' } }
    ]);
  });
});
