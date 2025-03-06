import { datetime } from '../functions/datetime.ts';
import { MessageFormat, MessageFunction, MessageNumberPart } from '../index.ts';

test('Custom function', () => {
  const custom: MessageFunction = (
    { dir, source, locales: [locale] },
    _opt,
    input
  ) => ({
    type: 'custom',
    source,
    dir: dir ?? 'auto',
    locale,
    toParts: () => [{ type: 'custom', source, locale, value: `part:${input}` }],
    toString: () => `str:${input}`
  });
  const mf = new MessageFormat('en', '{$var :custom}', {
    functions: { custom }
  });
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
});

describe('Type casts based on runtime', () => {
  const date = '2000-01-01T15:00:00';

  test('boolean function option with literal value', () => {
    const mfTrue = new MessageFormat(
      'en',
      '{$date :datetime timeStyle=short hour12=true}',
      { functions: { datetime } }
    );
    expect(mfTrue.format({ date })).toMatch(/3:00/);
    const mfFalse = new MessageFormat(
      'en',
      '{$date :datetime timeStyle=short hour12=false}',
      { functions: { datetime } }
    );
    expect(mfFalse.format({ date })).toMatch(/15:00/);
  });

  test('boolean function option with variable value', () => {
    const mf = new MessageFormat(
      'en',
      '{$date :datetime timeStyle=short hour12=$hour12}',
      { functions: { datetime } }
    );
    expect(mf.format({ date, hour12: 'false' })).toMatch(/15:00/);
    expect(mf.format({ date, hour12: false })).toMatch(/15:00/);
  });
});

describe('Function return is not a MessageValue', () => {
  test('object with type, but no source', () => {
    const functions = { fail: () => ({ type: 'fail' }) as any };
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
    const functions = { fail: () => null as any };
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
