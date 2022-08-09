import { MessageFormat } from '../index';

describe('Simple element', () => {
  test('no options, literal body', () => {
    const mf = new MessageFormat('{{+b}foo{-b}}');
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        { type: 'markup-start', options: {}, source: '+b', value: 'b' },
        { type: 'literal', value: 'foo' },
        { type: 'markup-end', source: '-b', value: 'b' }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('{+b}foo{-b}');
  });

  test('options, variables', () => {
    const mf = new MessageFormat('{{+b foo=42 bar=$foo}foo{$foo}{-b}}');
    const msg = mf.resolveMessage({ foo: 'foo bar' });
    expect(msg).toEqual({
      type: 'message',
      value: [
        {
          type: 'markup-start',
          options: { foo: '42', bar: 'foo bar' },
          source: '+b',
          value: 'b'
        },
        { type: 'literal', value: 'foo' },
        { type: 'value', source: '$foo', value: 'foo bar' },
        { type: 'markup-end', source: '-b', value: 'b' }
      ]
    });
    expect(msg.toString()).toBe('{+b foo=42 bar=(foo bar)}foofoo bar{-b}');
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
        { type: 'markup-end', source: '-b', value: 'b' },
        { type: 'markup-start', options: {}, source: '+a', value: 'a' },
        { type: 'literal', value: 'bar' },
        { type: 'markup-end', source: '-a', value: 'a' }
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
        { type: 'markup-end', source: '-a', value: 'a' },
        { type: 'markup-end', source: '-b', value: 'b' }
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
        { type: 'markup-end', source: '-b', value: 'b' },
        { type: 'literal', value: 'baz' },
        { type: 'markup-end', source: '-a', value: 'a' }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('{+b}foo{+a}bar{-b}baz{-a}');
  });
});
