// @ts-ignore
import { source } from 'common-tags';
import { compileFluent } from '@messageformat/compiler';

import { fluentRuntime, MessageFormat, Runtime } from './index';
import { FormattedDynamic } from './format-message';

describe('Function returns primitive value', () => {
  test('string', () => {
    const src = source`
      msg = { STRINGIFY($var) }
    `;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      STRINGIFY: { call: (_lc, _opt, arg) => String(arg), options: 'never' }
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
    const runtime: Runtime = {
      NUMERIC: { call: (_lc, _opt, arg) => Number(arg), options: 'never' }
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
      STRINGIFY: {
        call: (_lc, _opt, arg: string) =>
          new FormattedDynamic(['en'], String(arg), { foo: 'FOO' }),
        options: 'never'
      }
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg', { var: 42 })).toMatchObject([
      { type: 'dynamic', value: '42', meta: { foo: 'FOO' } }
    ]);
  });
});

describe('Type casts based on runtime', () => {
  test('boolean function option with literal value', () => {
    const src = source`
      true = { NUMBER($var) }
      false = { NUMBER($var) }
    `;
    const res = compileFluent(src, { id: 'res', locale: 'en' });

    // Hacky, but Fluent doesn't allow for useGrouping
    (res.entries.true as any).value[0].options = {
      useGrouping: { type: 'literal', value: 'true' }
    };
    (res.entries.false as any).value[0].options = {
      useGrouping: { type: 'literal', value: 'false' }
    };

    const mf = new MessageFormat('en', fluentRuntime, res);
    expect(mf.format('true', { var: 1234 })).toBe('1,234');
    expect(mf.format('false', { var: 1234 })).toBe('1234');
  });

  test('boolean function option with variable value', () => {
    const src = `msg = { NUMBER($var) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });

    // Hacky, but Fluent doesn't allow for useGrouping
    (res.entries.msg as any).value[0].options = {
      useGrouping: {
        type: 'variable',
        var_path: [{ type: 'literal', value: 'useGrouping' }]
      }
    };

    const mf = new MessageFormat('en', fluentRuntime, res);
    expect(mf.format('msg', { var: 1234, useGrouping: 'false' })).toBe('1,234');
    expect(mf.format('msg', { var: 1234, useGrouping: false })).toBe('1234');
  });
});
