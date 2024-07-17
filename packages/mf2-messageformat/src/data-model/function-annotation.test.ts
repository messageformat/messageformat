import {
  MessageFormat,
  MessageFunctions,
  MessageNumberPart
} from '../index.js';

test('Custom function', () => {
  const functions = {
    custom: ({ source, locales: [locale] }, _opt, input) => ({
      type: 'custom',
      source,
      locale,
      toParts: () => [
        { type: 'custom', source, locale, value: `part:${input}` }
      ],
      toString: () => `str:${input}`
    })
  } satisfies MessageFunctions;
  const mf = new MessageFormat('en', '{$var :custom}', { functions });
  expect(mf.format({ var: 42 })).toEqual('str:42');
  expect(mf.formatToParts({ var: 42 })).toEqual([
    { type: 'custom', source: '$var', locale: 'en', value: 'part:42' }
  ]);
});

describe('inputs with options', () => {
  test('local variable with :number expression', () => {
    const mf = new MessageFormat(
      'en',
      `.local $val = {12345678 :number useGrouping=false}
      {{{$val :number minimumFractionDigits=2}}}`
    );
    //const val = new MessageNumber(null, BigInt(12345678), { options: { useGrouping: false } });
    const msg = mf.formatToParts();
    const { parts } = msg[0] as MessageNumberPart;

    const nf = new Intl.NumberFormat('en', {
      minimumFractionDigits: 2,
      useGrouping: false
    });
    expect(parts).toEqual(nf.formatToParts(12345678));
  });

  test('value with options', () => {
    const mf = new MessageFormat(
      'en',
      '{$val :number minimumFractionDigits=2}'
    );
    const val = Object.assign(new Number(12345678), {
      options: { minimumFractionDigits: 4, useGrouping: false }
    });
    const msg = mf.formatToParts({ val });
    const { parts } = msg[0] as MessageNumberPart;

    const nf = new Intl.NumberFormat('en', {
      minimumFractionDigits: 2,
      useGrouping: false
    });
    expect(parts).toEqual(nf.formatToParts(12345678));
  });

  test('MessageValue locales take precedence', () => {
    const mf = new MessageFormat(
      'en',
      '{$val :number minimumFractionDigits=2}'
    );
    const val = Object.assign(new Number(12345), { locale: 'fi' });
    const msg = mf.formatToParts({ val });
    const { parts } = msg[0] as MessageNumberPart;

    const nf = new Intl.NumberFormat('fi', { minimumFractionDigits: 2 });
    expect(parts).toEqual(nf.formatToParts(12345));
  });
});

describe('Type casts based on runtime', () => {
  test('boolean function option with literal value', () => {
    const mfTrue = new MessageFormat('en', '{$var :number useGrouping=true}');
    expect(mfTrue.format({ var: 1234 })).toBe('1,234');
    const mfFalse = new MessageFormat('en', '{$var :number useGrouping=false}');
    expect(mfFalse.format({ var: 1234 })).toBe('1234');
  });

  test('boolean function option with variable value', () => {
    const mf = new MessageFormat(
      'en',
      '{$var :number useGrouping=$useGrouping}'
    );
    expect(mf.format({ var: 1234, useGrouping: 'false' })).toBe('1234');
    expect(mf.format({ var: 1234, useGrouping: false })).toBe('1234');
  });
});

describe('Function return is not a MessageValue', () => {
  test('object with type, but no source', () => {
    const functions = {
      fail: () => ({ type: 'fail' }) as any
    } satisfies MessageFunctions;
    const mf = new MessageFormat('en', '{:fail}', { functions });
    const onError = jest.fn();
    expect(mf.format(undefined, onError)).toEqual('{:fail}');
    expect(mf.formatToParts(undefined, onError)).toEqual([
      { type: 'fallback', source: ':fail' }
    ]);
    expect(onError).toHaveBeenCalledTimes(2);
  });

  test('null', () => {
    const functions = {
      fail: () => null as any
    } satisfies MessageFunctions;
    const mf = new MessageFormat('en', '{42 :fail}', { functions });
    const onError = jest.fn();
    expect(mf.format(undefined, onError)).toEqual('{|42|}');
    expect(mf.formatToParts(undefined, onError)).toEqual([
      { type: 'fallback', source: '|42|' }
    ]);
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
