// @ts-ignore
import { source } from 'common-tags';
import { compileFluent } from '@messageformat/compiler';

import {
  fluentRuntime,
  Formattable,
  FormattableNumber,
  MessageFormat,
  Runtime
} from '../index';

describe('Function returns generic value', () => {
  test('string', () => {
    const src = source`
      msg = { STRINGIFY($var) }
    `;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      STRINGIFY: { call: (_lc, _opt, arg) => String(arg), options: 'never' }
    };
    const mf = new MessageFormat('en', { runtime }, res);
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
    const mf = new MessageFormat('en', { runtime }, res);
    expect(mf.formatToParts('msg', { var: '42' })).toEqual([
      { type: 'integer', value: '42', source: 'NUMERIC($var)' }
    ]);
    expect(mf.format('msg', { var: '42' })).toBe('42');
  });

  test('Date', () => {
    const src = `msg = { NOW() }\n`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const date = new Date();
    const runtime: Runtime = {
      NOW: { call: () => date, options: 'never' }
    };
    const mf = new MessageFormat('en', { runtime }, res);
    const dtf = new Intl.DateTimeFormat('en');
    expect(mf.formatToParts('msg')).toEqual(
      dtf.formatToParts(date).map(part => ({ ...part, source: 'NOW()' }))
    );
    expect(mf.format('msg')).toBe(date.toLocaleString('en'));
  });
});

describe('Function returns Formattable', () => {
  test('with meta value', () => {
    const src = `msg = { STRINGIFY($var) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      STRINGIFY: {
        call: (_lc, _opt, arg: string) =>
          new Formattable(String(arg), {
            toParts: source => [
              {
                type: 'dynamic',
                value: String(arg),
                source,
                meta: { foo: 'FOO' }
              }
            ]
          }),
        options: 'never'
      }
    };
    const mf = new MessageFormat('en', { runtime }, res);
    expect(mf.formatToParts('msg', { var: 42 })).toEqual([
      {
        type: 'dynamic',
        value: '42',
        source: 'STRINGIFY($var)',
        meta: { foo: 'FOO' }
      }
    ]);
  });
});

describe('Function uses Formattable argument', () => {
  test('Options are merged', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    const val = new FormattableNumber(BigInt(12345678), { useGrouping: false });
    const parts = mf.formatToParts('msg', { val });

    const nf = new Intl.NumberFormat('en', {
      minimumFractionDigits: 2,
      useGrouping: false
    });
    expect(parts).toMatchObject(nf.formatToParts(12345678));
    expect(parts[0].source).toBe('NUMBER($val)');
  });

  test('Function options take precedence', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    const val = new FormattableNumber(42, { minimumFractionDigits: 4 });
    const parts = mf.formatToParts('msg', { val });

    const nf = new Intl.NumberFormat('en', { minimumFractionDigits: 2 });
    expect(parts).toMatchObject(nf.formatToParts(42));
    expect(parts[0].source).toBe('NUMBER($val)');
  });

  test('Formattable locales take precedence', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    const val = new FormattableNumber(12345, 'fi');
    const parts = mf.formatToParts('msg', { val });

    const nf = new Intl.NumberFormat('fi', { minimumFractionDigits: 2 });
    expect(parts).toMatchObject(nf.formatToParts(12345));
    expect(parts[0].source).toBe('NUMBER($val)');
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

    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
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

    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    expect(mf.format('msg', { var: 1234, useGrouping: 'false' })).toBe('1,234');
    expect(mf.format('msg', { var: 1234, useGrouping: false })).toBe('1234');
  });
});
