import {
  Element,
  Expression,
  Literal,
  MessageFormat,
  MessageGroup,
  VariableRef
} from '../index';

type Part = Literal | VariableRef | Expression | Element;
function getMF(pattern: Part[]) {
  const res: MessageGroup<Part> = {
    type: 'group',
    entries: { msg: { type: 'message', pattern } }
  };
  return new MessageFormat('en', {}, res);
}

describe('Simple element', () => {
  test('no options, literal body', () => {
    const mf = getMF([
      { type: 'element', name: 'b', tag: 'start' },
      { type: 'literal', value: 'foo' },
      { type: 'element', name: 'b', tag: 'end' }
    ]);
    expect(mf.getMessage('msg')).toEqual({
      type: 'message',
      value: [
        {
          type: 'element',
          name: 'b',
          options: {},
          source: '<b>',
          value: [{ type: 'literal', value: 'foo' }]
        }
      ]
    });
    expect(mf.getMessage('msg')?.toString()).toBe('<b>foo</b>');
  });

  test('options, variables', () => {
    const mf = getMF([
      {
        type: 'element',
        name: 'b',
        tag: 'start',
        options: {
          foo: { type: 'literal', value: '42' },
          bar: { type: 'variable', var_path: ['foo'] }
        }
      },
      { type: 'literal', value: 'foo' },
      { type: 'variable', var_path: ['foo'] },
      { type: 'element', name: 'b', tag: 'end' }
    ]);
    const msg = mf.getMessage('msg', { foo: 13 });
    expect(msg).toEqual({
      type: 'message',
      value: [
        {
          type: 'element',
          name: 'b',
          options: { foo: '42', bar: 13 },
          source: '<b>',
          value: [
            { type: 'literal', value: 'foo' },
            { type: 'number', source: '$foo', value: 13 }
          ]
        }
      ]
    });
    expect(msg?.toString()).toBe('<b foo="42" bar="13">foo13</b>');
  });
});

describe('Multiple elements', () => {
  // <b>foo</b><1>bar</1>
  test('adjacent', () => {
    const mf = getMF([
      { type: 'element', name: 'b', tag: 'start' },
      { type: 'literal', value: 'foo' },
      { type: 'element', name: 'b', tag: 'end' },
      { type: 'element', name: '1', tag: 'start' },
      { type: 'literal', value: 'bar' },
      { type: 'element', name: '1', tag: 'end' }
    ]);
    expect(mf.getMessage('msg')).toEqual({
      type: 'message',
      value: [
        {
          type: 'element',
          name: 'b',
          options: {},
          source: '<b>',
          value: [{ type: 'literal', value: 'foo' }]
        },
        {
          type: 'element',
          name: '1',
          options: {},
          source: '<1>',
          value: [{ type: 'literal', value: 'bar' }]
        }
      ]
    });
    expect(mf.getMessage('msg')?.toString()).toBe('<b>foo</b><1>bar</1>');
  });

  test('nested', () => {
    // <b>foo<1>bar</1></b>
    const mf = getMF([
      { type: 'element', name: 'b', tag: 'start' },
      { type: 'literal', value: 'foo' },
      { type: 'element', name: '1', tag: 'start' },
      { type: 'literal', value: 'bar' },
      { type: 'element', name: '1', tag: 'end' },
      { type: 'element', name: 'b', tag: 'end' }
    ]);
    expect(mf.getMessage('msg')).toEqual({
      type: 'message',
      value: [
        {
          type: 'element',
          name: 'b',
          options: {},
          source: '<b>',
          value: [
            { type: 'literal', value: 'foo' },
            {
              type: 'element',
              name: '1',
              options: {},
              source: '<1>',
              value: [{ type: 'literal', value: 'bar' }]
            }
          ]
        }
      ]
    });
    expect(mf.getMessage('msg')?.toString()).toBe('<b>foo<1>bar</1></b>');
  });

  test('overlapping', () => {
    // <b>foo<1>bar</b>baz</1>
    const mf = getMF([
      { type: 'element', name: 'b', tag: 'start' },
      { type: 'literal', value: 'foo' },
      { type: 'element', name: '1', tag: 'start' },
      { type: 'literal', value: 'bar' },
      { type: 'element', name: 'b', tag: 'end' },
      { type: 'literal', value: 'baz' },
      { type: 'element', name: '1', tag: 'end' }
    ]);
    expect(mf.getMessage('msg')).toEqual({
      type: 'message',
      value: [
        {
          type: 'element',
          name: 'b',
          options: {},
          source: '<b>',
          value: [
            { type: 'literal', value: 'foo' },
            {
              type: 'element',
              name: '1',
              options: {},
              source: '<1>',
              value: [{ type: 'literal', value: 'bar' }]
            }
          ]
        },
        {
          type: 'element',
          name: '1',
          options: {},
          source: '<1>',
          value: [{ type: 'literal', value: 'baz' }]
        }
      ]
    });
    expect(mf.getMessage('msg')?.toString()).toBe(
      '<b>foo<1>bar</1></b><1>baz</1>'
    );
  });
});
