// @ts-ignore
import { source } from 'common-tags';
import { compileFluent } from '@messageformat/compiler';

import {
  fluentRuntime,
  MessageDateTime,
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
    expect(mf.getMessage('res', 'msg', { var: 42 })).toMatchObject({
      type: 'message',
      value: [{ source: 'STRINGIFY($var)', type: 'value', value: '42' }]
    });
    expect(mf.format('msg', { var: 42 })).toBe('42');
  });

  test('number', () => {
    const src = `msg = { NUMERIC($var) }\n`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      NUMERIC: { call: (_lc, _opt, arg) => Number(arg), options: 'never' }
    };
    const mf = new MessageFormat('en', { runtime }, res);
    expect(mf.getMessage('res', 'msg', { var: '42' })).toEqual({
      type: 'message',
      value: [{ source: 'NUMERIC($var)', type: 'number', value: 42 }]
    });
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
    const msg = mf.getMessage('res', 'msg');
    expect(msg).toEqual({
      type: 'message',
      value: [{ type: 'datetime', source: 'NOW()', value: date }]
    });
    const parts = (msg?.value[0] as MessageDateTime).toParts();
    expect(parts).toEqual(dtf.formatToParts(date));
    expect(msg?.toString()).toBe(date.toLocaleString('en'));
  });
});

describe('Function returns MessageValue', () => {
  test('with custom toString method', () => {
    const src = `msg = { STRINGIFY($var) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    let toString: (() => string) | undefined;
    const runtime: Runtime = {
      STRINGIFY: {
        call: (lc, _opt, arg: string) => {
          toString = () => `str:${arg}`;
          return new MessageValue(MessageValue.type, lc, null, { toString });
        },
        options: 'never'
      }
    };
    const mf = new MessageFormat('en', { runtime }, res);
    expect(mf.getMessage('res', 'msg', { var: 42 })).toEqual({
      type: 'message',
      value: [
        { type: 'value', source: 'STRINGIFY($var)', toString, value: null }
      ]
    });
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
    const msg = mf.getMessage('res', 'msg', { val });
    const parts = (msg?.value[0] as MessageNumber).toParts();

    const nf = new Intl.NumberFormat('en', {
      minimumFractionDigits: 2,
      useGrouping: false
    });
    expect(parts).toEqual(nf.formatToParts(12345678));
  });

  test('Function options take precedence', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    const val = new MessageNumber(null, 42, {
      options: { minimumFractionDigits: 4 }
    });
    const msg = mf.getMessage('res', 'msg', { val });
    const parts = (msg?.value[0] as MessageNumber).toParts();

    const nf = new Intl.NumberFormat('en', { minimumFractionDigits: 2 });
    expect(parts).toEqual(nf.formatToParts(42));
  });

  test('MessageValue locales take precedence', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);
    const val = new MessageNumber('fi', 12345);
    const msg = mf.getMessage('res', 'msg', { val });
    const parts = (msg?.value[0] as MessageNumber).toParts();

    const nf = new Intl.NumberFormat('fi', { minimumFractionDigits: 2 });
    expect(parts).toEqual(nf.formatToParts(12345));
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
