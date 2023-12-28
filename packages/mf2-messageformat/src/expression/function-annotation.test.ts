import { MessageFormat, MessageFunctions, MessageNumberPart } from '../index';

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
  const mf = new MessageFormat('{$var :custom}', 'en', { functions });
  expect(mf.format({ var: 42 })).toEqual('str:42');
  expect(mf.formatToParts({ var: 42 })).toEqual([
    { type: 'custom', source: '$var', locale: 'en', value: 'part:42' }
  ]);
});

describe('inputs with options', () => {
  test('local variable with :number expression', () => {
    const mf = new MessageFormat(
      `.let $val = {12345678 :number useGrouping=false}
      {{{$val :number minimumFractionDigits=2}}}`,
      'en'
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
      '{$val :number minimumFractionDigits=2}',
      'en'
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
      '{$val :number minimumFractionDigits=2}',
      'en'
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
    const mfTrue = new MessageFormat('{$var :number useGrouping=true}', 'en');
    expect(mfTrue.format({ var: 1234 })).toBe('1,234');
    const mfFalse = new MessageFormat('{$var :number useGrouping=false}', 'en');
    expect(mfFalse.format({ var: 1234 })).toBe('1234');
  });

  test('boolean function option with variable value', () => {
    const mf = new MessageFormat(
      '{$var :number useGrouping=$useGrouping}',
      'en'
    );
    expect(mf.format({ var: 1234, useGrouping: 'false' })).toBe('1234');
    expect(mf.format({ var: 1234, useGrouping: false })).toBe('1234');
  });
});

describe('Simple open/close', () => {
  test('no options, literal body', () => {
    const mf = new MessageFormat('{+b}foo{-b}');
    expect(mf.formatToParts()).toEqual([
      { type: 'open', source: '+b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'close', source: '-b', name: 'b' }
    ]);
    expect(mf.format()).toBe('foo');
  });

  test('arguments, options, variables', () => {
    const mf = new MessageFormat(
      '{|x| +b foo=42 bar=$foo}foo{$foo}{|y| -b foo=13}',
      'en'
    );
    const msg = mf.formatToParts({ foo: 'foo bar' });
    expect(msg).toEqual([
      {
        type: 'open',
        options: { foo: '42', bar: 'foo bar' },
        source: '|x|',
        name: 'b',
        value: 'x'
      },
      { type: 'literal', value: 'foo' },
      { type: 'string', locale: 'en', source: '$foo', value: 'foo bar' },
      {
        type: 'close',
        options: { foo: '13' },
        source: '|y|',
        name: 'b',
        value: 'y'
      }
    ]);
    expect(mf.format({ foo: 'foo bar' })).toBe('foofoo bar');
  });
});

describe('Multiple open/close', () => {
  test('adjacent', () => {
    const mf = new MessageFormat('{+b}foo{-b}{+a}bar{-a}');
    expect(mf.formatToParts()).toEqual([
      { type: 'open', source: '+b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'close', source: '-b', name: 'b' },
      { type: 'open', source: '+a', name: 'a' },
      { type: 'literal', value: 'bar' },
      { type: 'close', source: '-a', name: 'a' }
    ]);
    expect(mf.format()).toBe('foobar');
  });

  test('nested', () => {
    const mf = new MessageFormat('{+b}foo{+a}bar{-a}{-b}');
    expect(mf.formatToParts()).toEqual([
      { type: 'open', source: '+b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'open', source: '+a', name: 'a' },
      { type: 'literal', value: 'bar' },
      { type: 'close', source: '-a', name: 'a' },
      { type: 'close', source: '-b', name: 'b' }
    ]);
    expect(mf.format()).toBe('foobar');
  });

  test('overlapping', () => {
    const mf = new MessageFormat('{+b}foo{+a}bar{-b}baz{-a}');
    expect(mf.formatToParts()).toEqual([
      { type: 'open', source: '+b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'open', source: '+a', name: 'a' },
      { type: 'literal', value: 'bar' },
      { type: 'close', source: '-b', name: 'b' },
      { type: 'literal', value: 'baz' },
      { type: 'close', source: '-a', name: 'a' }
    ]);
    expect(mf.format()).toBe('foobarbaz');
  });
});
