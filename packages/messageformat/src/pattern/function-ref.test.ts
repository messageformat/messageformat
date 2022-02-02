// @ts-ignore
import { source } from 'common-tags';
import { compileFluent } from '@messageformat/compiler';

import {
  fluentRuntime,
  MessageValue,
  MessageNumber,
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

describe('Function returns MessageValue', () => {
  test('with custom toString method', () => {
    const src = `msg = { STRINGIFY($var) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      STRINGIFY: {
        call: (lc, _opt, arg: string) =>
          new MessageValue(lc, null, { toString: () => `str:${arg}` }),
        options: 'never'
      }
    };
    const mf = new MessageFormat('en', { runtime }, res);
    expect(mf.formatToParts('msg', { var: 42 })).toEqual([
      { type: 'dynamic', value: 'str:42', source: 'STRINGIFY($var)' }
    ]);
  });
});

describe('Function uses MessageValue argument', () => {
  test('Options are merged', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    const val = new MessageNumber(null, BigInt(12345678), {
      options: { useGrouping: false }
    });
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
    const val = new MessageNumber(null, 42, {
      options: { minimumFractionDigits: 4 }
    });
    const parts = mf.formatToParts('msg', { val });

    const nf = new Intl.NumberFormat('en', { minimumFractionDigits: 2 });
    expect(parts).toMatchObject(nf.formatToParts(42));
    expect(parts[0].source).toBe('NUMBER($val)');
  });

  test('MessageValue locales take precedence', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    const val = new MessageNumber('fi', 12345);
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
    (res.entries.true as any).pattern[0].options = {
      useGrouping: { type: 'literal', value: 'true' }
    };
    (res.entries.false as any).pattern[0].options = {
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
    (res.entries.msg as any).pattern[0].options = {
      useGrouping: { type: 'variable', var_path: ['useGrouping'] }
    };

    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    expect(mf.format('msg', { var: 1234, useGrouping: 'false' })).toBe('1,234');
    expect(mf.format('msg', { var: 1234, useGrouping: false })).toBe('1234');
  });
});
