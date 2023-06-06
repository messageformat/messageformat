import {
  MessageDateTime,
  MessageFormat,
  MessageNumber,
  MessageValue,
  Runtime
} from '../index';

describe('Function returns generic value', () => {
  test('string', () => {
    const runtime = {
      stringify: (_lc, _opt, arg) => String(arg)
    } satisfies Runtime;
    const mf = new MessageFormat('{{$var :stringify}}', 'en', { runtime });
    const msg = mf.resolveMessage({ var: 42 });
    expect(msg).toMatchObject({
      type: 'message',
      value: [{ source: '$var', type: 'value', value: '42' }]
    });
    expect(msg.toString()).toBe('42');
  });

  test('number', () => {
    const runtime = {
      numeric: (_lc, _opt, arg) => Number(arg)
    } satisfies Runtime;
    const mf = new MessageFormat('{{$var :numeric}}', 'en', { runtime });
    const msg = mf.resolveMessage({ var: '42' });
    expect(msg).toEqual({
      type: 'message',
      value: [{ source: '$var', type: 'number', value: 42 }]
    });
    expect(msg.toString()).toBe('42');
  });

  test('Date', () => {
    const date = new Date();
    const runtime = { now: () => date } satisfies Runtime;
    const mf = new MessageFormat('{{:now}}', 'en', { runtime });
    const dtf = new Intl.DateTimeFormat('en');
    const msg = mf.resolveMessage();
    expect(msg).toEqual({
      type: 'message',
      value: [{ type: 'datetime', source: ':now', value: date }]
    });
    const parts = (msg.value[0] as MessageDateTime).toParts();
    expect(parts).toEqual(dtf.formatToParts(date));
    expect(msg?.toString()).toBe(date.toLocaleString('en'));
  });
});

describe('Function returns MessageValue', () => {
  test('with custom toString method', () => {
    let toString: (() => string) | undefined;
    const runtime = {
      stringify(lc, _opt, arg?: MessageValue) {
        toString = () => `str:${arg}`;
        return new MessageValue(null, lc, null, { toString });
      }
    } satisfies Runtime;
    const mf = new MessageFormat('{{$var :stringify}}', 'en', { runtime });
    expect(mf.resolveMessage({ var: 42 })).toEqual({
      type: 'message',
      value: [{ type: 'value', source: '$var', toString, value: null }]
    });
  });
});

describe('Function uses MessageValue argument', () => {
  test('Options are merged', () => {
    const mf = new MessageFormat(
      '{{$val :number minimumFractionDigits=2}}',
      'en'
    );
    const val = new MessageNumber(null, BigInt(12345678), {
      options: { useGrouping: false }
    });
    const msg = mf.resolveMessage({ val });
    const parts = (msg?.value[0] as MessageNumber).toParts();

    const nf = new Intl.NumberFormat('en', {
      minimumFractionDigits: 2,
      useGrouping: false
    });
    expect(parts).toEqual(nf.formatToParts(12345678));
  });

  test('Function options take precedence', () => {
    const mf = new MessageFormat(
      '{{$val :number minimumFractionDigits=2}}',
      'en'
    );
    const val = new MessageNumber(null, 42, {
      options: { minimumFractionDigits: 4 }
    });
    const msg = mf.resolveMessage({ val });
    const parts = (msg?.value[0] as MessageNumber).toParts();

    const nf = new Intl.NumberFormat('en', { minimumFractionDigits: 2 });
    expect(parts).toEqual(nf.formatToParts(42));
  });

  test('MessageValue locales take precedence', () => {
    const mf = new MessageFormat(
      '{{$val :number minimumFractionDigits=2}}',
      'en'
    );
    const val = new MessageNumber('fi', 12345);
    const msg = mf?.resolveMessage({ val });
    const parts = (msg?.value[0] as MessageNumber).toParts();

    const nf = new Intl.NumberFormat('fi', { minimumFractionDigits: 2 });
    expect(parts).toEqual(nf.formatToParts(12345));
  });
});

describe('Type casts based on runtime', () => {
  test('boolean function option with literal value', () => {
    const mfTrue = new MessageFormat('{{$var :number useGrouping=true}}', 'en');
    expect(mfTrue.resolveMessage({ var: 1234 })?.toString()).toBe('1,234');
    const mfFalse = new MessageFormat(
      '{{$var :number useGrouping=false}}',
      'en'
    );
    expect(mfFalse.resolveMessage({ var: 1234 })?.toString()).toBe('1234');
  });

  test('boolean function option with variable value', () => {
    const mf = new MessageFormat(
      '{{$var :number useGrouping=$useGrouping}}',
      'en'
    );
    expect(
      mf?.resolveMessage({ var: 1234, useGrouping: 'false' })?.toString()
    ).toBe('1234');
    expect(
      mf?.resolveMessage({ var: 1234, useGrouping: false })?.toString()
    ).toBe('1234');
  });
});

describe('Simple element', () => {
  test('no options, literal body', () => {
    const mf = new MessageFormat('{{+b}foo{-b}}');
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        { type: 'markup-start', options: {}, source: '+b', value: 'b' },
        { type: 'literal', value: 'foo' },
        { type: 'markup-end', options: {}, source: '-b', value: 'b' }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('{+b}foo{-b}');
  });

  test('arguments, options, variables', () => {
    const mf = new MessageFormat(
      '{{|x| +b foo=42 bar=$foo}foo{$foo}{|y| -b foo=13}}'
    );
    const msg = mf.resolveMessage({ foo: 'foo bar' });
    expect(msg).toEqual({
      type: 'message',
      value: [
        {
          type: 'markup-start',
          operand: { type: 'literal', value: 'x' },
          options: { foo: '42', bar: 'foo bar' },
          source: 'x',
          value: 'b'
        },
        { type: 'literal', value: 'foo' },
        { type: 'value', source: '$foo', value: 'foo bar' },
        {
          type: 'markup-end',
          operand: { type: 'literal', value: 'y' },
          options: { foo: '13' },
          source: 'y',
          value: 'b'
        }
      ]
    });
    expect(msg.toString()).toBe('{+b}foofoo bar{-b}');
  });
});

describe('Multiple elements', () => {
  test('adjacent', () => {
    const mf = new MessageFormat('{{+b}foo{-b}{+a}bar{-a}}');
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        { type: 'markup-start', options: {}, source: '+b', value: 'b' },
        { type: 'literal', value: 'foo' },
        { type: 'markup-end', options: {}, source: '-b', value: 'b' },
        { type: 'markup-start', options: {}, source: '+a', value: 'a' },
        { type: 'literal', value: 'bar' },
        { type: 'markup-end', options: {}, source: '-a', value: 'a' }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('{+b}foo{-b}{+a}bar{-a}');
  });

  test('nested', () => {
    const mf = new MessageFormat('{{+b}foo{+a}bar{-a}{-b}}');
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        { type: 'markup-start', options: {}, source: '+b', value: 'b' },
        { type: 'literal', value: 'foo' },
        { type: 'markup-start', options: {}, source: '+a', value: 'a' },
        { type: 'literal', value: 'bar' },
        { type: 'markup-end', options: {}, source: '-a', value: 'a' },
        { type: 'markup-end', options: {}, source: '-b', value: 'b' }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('{+b}foo{+a}bar{-a}{-b}');
  });

  test('overlapping', () => {
    const mf = new MessageFormat('{{+b}foo{+a}bar{-b}baz{-a}}');
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        { type: 'markup-start', options: {}, source: '+b', value: 'b' },
        { type: 'literal', value: 'foo' },
        { type: 'markup-start', options: {}, source: '+a', value: 'a' },
        { type: 'literal', value: 'bar' },
        { type: 'markup-end', options: {}, source: '-b', value: 'b' },
        { type: 'literal', value: 'baz' },
        { type: 'markup-end', options: {}, source: '-a', value: 'a' }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('{+b}foo{+a}bar{-b}baz{-a}');
  });
});
