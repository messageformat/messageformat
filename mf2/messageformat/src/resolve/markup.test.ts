import { parseCST } from '../cst/index.ts';
import { MessageFormat } from '../index.ts';

describe('Simple open/close', () => {
  test('no options, literal body', () => {
    const mf = new MessageFormat(undefined, '{#b}foo{/b}');
    expect(mf.formatToParts()).toEqual([
      { type: 'markup', kind: 'open', name: 'b' },
      { type: 'text', value: 'foo' },
      { type: 'markup', kind: 'close', name: 'b' }
    ]);
    expect(mf.format()).toBe('foo');
  });

  test('options', () => {
    const mf = new MessageFormat(
      'en',
      '{#b foo=42 bar=$foo}foo{$foo}{/b foo=| bar 13 |}'
    );
    const msg = mf.formatToParts({ foo: 'foo bar' });
    expect(msg).toEqual([
      {
        type: 'markup',
        kind: 'open',
        options: { foo: '42', bar: 'foo bar' },
        name: 'b'
      },
      { type: 'text', value: 'foo' },
      { type: 'bidiIsolation', value: '\u2068' },
      { type: 'string', locale: 'en', value: 'foo bar' },
      { type: 'bidiIsolation', value: '\u2069' },
      { type: 'markup', kind: 'close', name: 'b', options: { foo: ' bar 13 ' } }
    ]);
    expect(mf.format({ foo: 'foo bar' })).toBe('foo\u2068foo bar\u2069');
  });

  test('do not allow operands', () => {
    const src = '{x #b}';
    expect(() => new MessageFormat('en', src)).toThrow();
    const cst = parseCST(src);
    expect(cst).toMatchObject({
      type: 'simple',
      errors: [{ type: 'extra-content' }],
      pattern: {
        body: [
          {
            type: 'expression',
            markup: { type: 'markup', name: [{ value: 'b' }] }
          }
        ]
      }
    });
  });
});

describe('Multiple open/close', () => {
  test('adjacent', () => {
    const mf = new MessageFormat(undefined, '{#b}foo{/b}{#a}bar{/a}');
    expect(mf.formatToParts()).toEqual([
      { type: 'markup', kind: 'open', name: 'b' },
      { type: 'text', value: 'foo' },
      { type: 'markup', kind: 'close', name: 'b' },
      { type: 'markup', kind: 'open', name: 'a' },
      { type: 'text', value: 'bar' },
      { type: 'markup', kind: 'close', name: 'a' }
    ]);
    expect(mf.format()).toBe('foobar');
  });

  test('nested', () => {
    const mf = new MessageFormat(undefined, '{#b}foo{#a}bar{/a}{/b}');
    expect(mf.formatToParts()).toEqual([
      { type: 'markup', kind: 'open', name: 'b' },
      { type: 'text', value: 'foo' },
      { type: 'markup', kind: 'open', name: 'a' },
      { type: 'text', value: 'bar' },
      { type: 'markup', kind: 'close', name: 'a' },
      { type: 'markup', kind: 'close', name: 'b' }
    ]);
    expect(mf.format()).toBe('foobar');
  });

  test('overlapping', () => {
    const mf = new MessageFormat(undefined, '{#b}foo{#a}bar{/b}baz{/a}');
    expect(mf.formatToParts()).toEqual([
      { type: 'markup', kind: 'open', name: 'b' },
      { type: 'text', value: 'foo' },
      { type: 'markup', kind: 'open', name: 'a' },
      { type: 'text', value: 'bar' },
      { type: 'markup', kind: 'close', name: 'b' },
      { type: 'text', value: 'baz' },
      { type: 'markup', kind: 'close', name: 'a' }
    ]);
    expect(mf.format()).toBe('foobarbaz');
  });
});
