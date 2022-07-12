import {
  Expression,
  Literal,
  MarkupEnd,
  MarkupStart,
  MessageFormat,
  VariableRef
} from '../index';

type Part = Literal | VariableRef | Expression | MarkupStart | MarkupEnd;
function getMF(body: Part[]) {
  return new MessageFormat(
    { type: 'message', declarations: [], pattern: { body } },
    'en'
  );
}

describe('Simple element', () => {
  test('no options, literal body', () => {
    const mf = getMF([
      { type: 'markup-start', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup-end', name: 'b' }
    ]);
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        {
          type: 'markup',
          name: 'b',
          options: {},
          source: '<b>',
          value: [{ type: 'literal', value: 'foo' }]
        }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('<b>foo</b>');
  });

  test('options, variables', () => {
    const mf = getMF([
      {
        type: 'markup-start',
        name: 'b',
        options: [
          { name: 'foo', value: { type: 'literal', value: '42' } },
          { name: 'bar', value: { type: 'variable', name: 'foo' } }
        ]
      },
      { type: 'literal', value: 'foo' },
      { type: 'variable', name: 'foo' },
      { type: 'markup-end', name: 'b' }
    ]);
    const msg = mf.resolveMessage({ foo: 13 });
    expect(msg).toEqual({
      type: 'message',
      value: [
        {
          type: 'markup',
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
    expect(msg.toString()).toBe('<b foo="42" bar="13">foo13</b>');
  });
});

describe('Multiple elements', () => {
  // <b>foo</b><1>bar</1>
  test('adjacent', () => {
    const mf = getMF([
      { type: 'markup-start', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup-end', name: 'b' },
      { type: 'markup-start', name: '1' },
      { type: 'literal', value: 'bar' },
      { type: 'markup-end', name: '1' }
    ]);
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        {
          type: 'markup',
          name: 'b',
          options: {},
          source: '<b>',
          value: [{ type: 'literal', value: 'foo' }]
        },
        {
          type: 'markup',
          name: '1',
          options: {},
          source: '<1>',
          value: [{ type: 'literal', value: 'bar' }]
        }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('<b>foo</b><1>bar</1>');
  });

  test('nested', () => {
    // <b>foo<1>bar</1></b>
    const mf = getMF([
      { type: 'markup-start', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup-start', name: '1' },
      { type: 'literal', value: 'bar' },
      { type: 'markup-end', name: '1' },
      { type: 'markup-end', name: 'b' }
    ]);
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        {
          type: 'markup',
          name: 'b',
          options: {},
          source: '<b>',
          value: [
            { type: 'literal', value: 'foo' },
            {
              type: 'markup',
              name: '1',
              options: {},
              source: '<1>',
              value: [{ type: 'literal', value: 'bar' }]
            }
          ]
        }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe('<b>foo<1>bar</1></b>');
  });

  test('overlapping', () => {
    // <b>foo<1>bar</b>baz</1>
    const mf = getMF([
      { type: 'markup-start', name: 'b' },
      { type: 'literal', value: 'foo' },
      { type: 'markup-start', name: '1' },
      { type: 'literal', value: 'bar' },
      { type: 'markup-end', name: 'b' },
      { type: 'literal', value: 'baz' },
      { type: 'markup-end', name: '1' }
    ]);
    expect(mf.resolveMessage()).toEqual({
      type: 'message',
      value: [
        {
          type: 'markup',
          name: 'b',
          options: {},
          source: '<b>',
          value: [
            { type: 'literal', value: 'foo' },
            {
              type: 'markup',
              name: '1',
              options: {},
              source: '<1>',
              value: [{ type: 'literal', value: 'bar' }]
            }
          ]
        },
        {
          type: 'markup',
          name: '1',
          options: {},
          source: '<1>',
          value: [{ type: 'literal', value: 'baz' }]
        }
      ]
    });
    expect(mf.resolveMessage().toString()).toBe(
      '<b>foo<1>bar</1></b><1>baz</1>'
    );
  });
});
