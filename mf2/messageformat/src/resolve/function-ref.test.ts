import type { MessageFunctions, MessageNumberPart } from '../index.ts';
import { MessageFormat } from '../index.ts';

test('Custom function', () => {
  const functions = {
    custom: ({ dir, source, locales: [locale] }, _opt, input) => ({
      type: 'custom',
      source,
      dir: dir ?? 'auto',
      locale,
      toParts: () => [
        { type: 'custom', source, locale, value: `part:${input}` }
      ],
      toString: () => `str:${input}`
    })
  } satisfies MessageFunctions;
  const mf = new MessageFormat('en', '{$var :custom}', { functions });
  expect(mf.format({ var: 42 })).toEqual('\u2068str:42\u2069');
  expect(mf.formatToParts({ var: 42 })).toEqual([
    { type: 'bidiIsolation', value: '\u2068' },
    { type: 'custom', source: '$var', locale: 'en', value: 'part:42' },
    { type: 'bidiIsolation', value: '\u2069' }
  ]);
});

describe('inputs with options', () => {
  test('local variable with :number expression', () => {
    const mf = new MessageFormat(
      'en',
      `.local $val = {12345678 :number useGrouping=never}
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

  test('u:locale value take precedence', () => {
    const mf = new MessageFormat(
      'en',
      '{$val :number minimumFractionDigits=2 u:locale=ar}'
    );
    const msg = mf.formatToParts({ val: 12345 });
    const { parts } = msg[1] as MessageNumberPart;

    const ar = new Intl.NumberFormat('ar', { minimumFractionDigits: 2 });
    expect(parts).toEqual(ar.formatToParts(12345));
  });
});

describe('Type casts based on runtime', () => {
  const date = '2000-01-01T15:00:00';

  test('boolean function option with literal value', () => {
    const mfTrue = new MessageFormat(
      'en',
      '{$date :datetime timeStyle=short hour12=true}'
    );
    expect(mfTrue.format({ date })).toMatch(/3:00/);
    const mfFalse = new MessageFormat(
      'en',
      '{$date :datetime timeStyle=short hour12=false}'
    );
    expect(mfFalse.format({ date })).toMatch(/15:00/);
  });

  test('boolean function option with variable value', () => {
    const mf = new MessageFormat(
      'en',
      '{$date :datetime timeStyle=short hour12=$hour12}'
    );
    expect(mf.format({ date, hour12: 'false' })).toMatch(/15:00/);
    expect(mf.format({ date, hour12: false })).toMatch(/15:00/);
  });
});

describe('Function return is not a MessageValue', () => {
  test('object with type, but no source', () => {
    const functions = {
      fail: () => ({ type: 'fail' }) as any
    } satisfies MessageFunctions;
    const mf = new MessageFormat('en', '{:fail}', { functions });
    const onError = jest.fn();
    expect(mf.format(undefined, onError)).toEqual('\u2068{:fail}\u2069');
    expect(mf.formatToParts(undefined, onError)).toEqual([
      { type: 'bidiIsolation', value: '\u2068' },
      { type: 'fallback', source: ':fail' },
      { type: 'bidiIsolation', value: '\u2069' }
    ]);
    expect(onError).toHaveBeenCalledTimes(2);
  });

  test('null', () => {
    const functions = {
      fail: () => null as any
    } satisfies MessageFunctions;
    const mf = new MessageFormat('en', '{42 :fail}', { functions });
    const onError = jest.fn();
    expect(mf.format(undefined, onError)).toEqual('\u2068{|42|}\u2069');
    expect(mf.formatToParts(undefined, onError)).toEqual([
      { type: 'bidiIsolation', value: '\u2068' },
      { type: 'fallback', source: '|42|' },
      { type: 'bidiIsolation', value: '\u2069' }
    ]);
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
