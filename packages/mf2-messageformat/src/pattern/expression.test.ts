import {
  compileFluentResource,
  compileFluentResourceData
} from '@messageformat/fluent';
import { source } from '@messageformat/test-utils';

import {
  Expression,
  MessageDateTime,
  MessageValue,
  MessageNumber,
  PatternMessage,
  Runtime
} from '../index';

describe('Function returns generic value', () => {
  test('string', () => {
    const src = source`
      msg = { STRINGIFY($var) }
    `;
    const runtime: Runtime = {
      STRINGIFY: { call: (_lc, _opt, arg) => String(arg), options: 'never' }
    };
    const res = compileFluentResource(src, 'en', { runtime });
    const mf = res.get('msg');
    expect(mf?.resolveMessage({ var: 42 })).toMatchObject({
      type: 'message',
      value: [{ source: '$var :STRINGIFY', type: 'value', value: '42' }]
    });
    expect(mf?.resolveMessage({ var: 42 }).toString()).toBe('42');
  });

  test('number', () => {
    const src = `msg = { NUMERIC($var) }\n`;
    const runtime: Runtime = {
      NUMERIC: { call: (_lc, _opt, arg) => Number(arg), options: 'never' }
    };
    const res = compileFluentResource(src, 'en', { runtime });
    const mf = res.get('msg');
    expect(mf?.resolveMessage({ var: '42' })).toEqual({
      type: 'message',
      value: [{ source: '$var :NUMERIC', type: 'number', value: 42 }]
    });
    expect(mf?.resolveMessage({ var: '42' })?.toString()).toBe('42');
  });

  test('Date', () => {
    const src = `msg = { NOW() }\n`;
    const date = new Date();
    const runtime: Runtime = {
      NOW: { call: () => date, options: 'never' }
    };
    const res = compileFluentResource(src, 'en', { runtime });
    const mf = res.get('msg');
    const dtf = new Intl.DateTimeFormat('en');
    const msg = mf?.resolveMessage();
    expect(msg).toEqual({
      type: 'message',
      value: [{ type: 'datetime', source: ':NOW', value: date }]
    });
    const parts = (msg?.value[0] as MessageDateTime).toParts();
    expect(parts).toEqual(dtf.formatToParts(date));
    expect(msg?.toString()).toBe(date.toLocaleString('en'));
  });
});

describe('Function returns MessageValue', () => {
  test('with custom toString method', () => {
    const src = `msg = { STRINGIFY($var) }`;
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
    const res = compileFluentResource(src, 'en', { runtime });
    const mf = res.get('msg');
    expect(mf?.resolveMessage({ var: 42 })).toEqual({
      type: 'message',
      value: [
        { type: 'value', source: '$var :STRINGIFY', toString, value: null }
      ]
    });
  });
});

describe('Function uses MessageValue argument', () => {
  test('Options are merged', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluentResource(src, 'en');
    const mf = res.get('msg');
    const val = new MessageNumber(null, BigInt(12345678), {
      options: { useGrouping: false }
    });
    const msg = mf?.resolveMessage({ val });
    const parts = (msg?.value[0] as MessageNumber).toParts();

    const nf = new Intl.NumberFormat('en', {
      minimumFractionDigits: 2,
      useGrouping: false
    });
    expect(parts).toEqual(nf.formatToParts(12345678));
  });

  test('Function options take precedence', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluentResource(src, 'en');
    const mf = res.get('msg');
    const val = new MessageNumber(null, 42, {
      options: { minimumFractionDigits: 4 }
    });
    const msg = mf?.resolveMessage({ val });
    const parts = (msg?.value[0] as MessageNumber).toParts();

    const nf = new Intl.NumberFormat('en', { minimumFractionDigits: 2 });
    expect(parts).toEqual(nf.formatToParts(42));
  });

  test('MessageValue locales take precedence', () => {
    const src = `msg = { NUMBER($val, minimumFractionDigits: 2) }`;
    const res = compileFluentResource(src, 'en');
    const mf = res.get('msg');
    const val = new MessageNumber('fi', 12345);
    const msg = mf?.resolveMessage({ val });
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
    const { data } = compileFluentResourceData(src);

    // Hacky, but Fluent doesn't allow for useGrouping
    const tx = (data.get('true') as PatternMessage).pattern
      .body[0] as Expression;
    tx.options = [
      { name: 'useGrouping', value: { type: 'nmtoken', value: 'true' } }
    ];
    const fx = (data.get('false') as PatternMessage).pattern
      .body[0] as Expression;
    fx.options = [
      { name: 'useGrouping', value: { type: 'nmtoken', value: 'false' } }
    ];

    const res = compileFluentResource(data, 'en');
    expect(res.get('true')?.resolveMessage({ var: 1234 })?.toString()).toBe(
      '1,234'
    );
    expect(res.get('false')?.resolveMessage({ var: 1234 })?.toString()).toBe(
      '1234'
    );
  });

  test('boolean function option with variable value', () => {
    const src = `msg = { NUMBER($var) }`;
    const { data } = compileFluentResourceData(src);

    // Hacky, but Fluent doesn't allow for useGrouping
    const vx = (data.get('msg') as PatternMessage).pattern
      .body[0] as Expression;
    vx.options = [
      { name: 'useGrouping', value: { type: 'variable', name: 'useGrouping' } }
    ];

    const res = compileFluentResource(data, 'en');
    const mf = res.get('msg');
    expect(
      mf?.resolveMessage({ var: 1234, useGrouping: 'false' })?.toString()
    ).toBe('1,234');
    expect(
      mf?.resolveMessage({ var: 1234, useGrouping: false })?.toString()
    ).toBe('1234');
  });
});
