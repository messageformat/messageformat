import { MessageFormat, parseCST } from '../index.js';

describe('Simple open/close', () => {
  test('no options, literal body', () => {
    const mf = new MessageFormat(undefined, '{#b}foo{/b}');
    expect(mf.formatToParts()).toEqual([
      { type: 'markup', kind: 'open', source: '#b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup', kind: 'close', source: '/b', name: 'b' }
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
        source: '#b',
        name: 'b'
      },
      { type: 'literal', value: 'foo' },
      { type: 'string', locale: 'en', source: '$foo', value: 'foo bar' },
      {
        type: 'markup',
        kind: 'close',
        source: '/b',
        name: 'b',
        options: { foo: ' bar 13 ' }
      }
    ]);
    expect(mf.format({ foo: 'foo bar' })).toBe('foofoo bar');
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
      { type: 'markup', kind: 'open', source: '#b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup', kind: 'close', source: '/b', name: 'b' },
      { type: 'markup', kind: 'open', source: '#a', name: 'a' },
      { type: 'literal', value: 'bar' },
      { type: 'markup', kind: 'close', source: '/a', name: 'a' }
    ]);
    expect(mf.format()).toBe('foobar');
  });

  test('nested', () => {
    const mf = new MessageFormat(undefined, '{#b}foo{#a}bar{/a}{/b}');
    expect(mf.formatToParts()).toEqual([
      { type: 'markup', kind: 'open', source: '#b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup', kind: 'open', source: '#a', name: 'a' },
      { type: 'literal', value: 'bar' },
      { type: 'markup', kind: 'close', source: '/a', name: 'a' },
      { type: 'markup', kind: 'close', source: '/b', name: 'b' }
    ]);
    expect(mf.format()).toBe('foobar');
  });

  test('overlapping', () => {
    const mf = new MessageFormat(undefined, '{#b}foo{#a}bar{/b}baz{/a}');
    expect(mf.formatToParts()).toEqual([
      { type: 'markup', kind: 'open', source: '#b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup', kind: 'open', source: '#a', name: 'a' },
      { type: 'literal', value: 'bar' },
      { type: 'markup', kind: 'close', source: '/b', name: 'b' },
      { type: 'literal', value: 'baz' },
      { type: 'markup', kind: 'close', source: '/a', name: 'a' }
    ]);
    expect(mf.format()).toBe('foobarbaz');
  });
});
