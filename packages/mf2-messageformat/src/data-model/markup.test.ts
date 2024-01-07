import { MessageFormat, parseCST } from '../index.js';

describe('Simple open/close', () => {
  test('no options, literal body', () => {
    const mf = new MessageFormat('{#b}foo{/b}');
    expect(mf.formatToParts()).toEqual([
      { type: 'markup', kind: 'open', source: '#b', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup', kind: 'close', source: '/b', name: 'b' }
    ]);
    expect(mf.format()).toBe('foo');
  });

  test('options', () => {
    const mf = new MessageFormat('{#b foo=42 bar=$foo}foo{$foo}{/b}', 'en');
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
      { type: 'markup', kind: 'close', source: '/b', name: 'b' }
    ]);
    expect(mf.format({ foo: 'foo bar' })).toBe('foofoo bar');
  });

  test('do not allow operands', () => {
    const src = '{x #b}';
    expect(() => new MessageFormat(src, 'en')).toThrow();
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

  test('do not allow options on close', () => {
    const src = '{/b foo=13}';
    expect(() => new MessageFormat(src, 'en')).toThrow();
    const cst = parseCST(src);
    expect(cst).toMatchObject({
      type: 'simple',
      errors: [{ type: 'extra-content' }],
      pattern: {
        body: [
          {
            type: 'expression',
            markup: { type: 'markup-close', name: [{ value: 'b' }] }
          }
        ]
      }
    });
    expect(cst).not.toHaveProperty('pattern.body.0.markup.options');
  });
});

describe('Multiple open/close', () => {
  test('adjacent', () => {
    const mf = new MessageFormat('{#b}foo{/b}{#a}bar{/a}');
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
    const mf = new MessageFormat('{#b}foo{#a}bar{/a}{/b}');
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
    const mf = new MessageFormat('{#b}foo{#a}bar{/b}baz{/a}');
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
