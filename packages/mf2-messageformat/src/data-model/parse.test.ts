import { parseMessage } from '../index.js';

describe('private annotations', () => {
  for (const source of ['{^foo}', '{&bar}']) {
    test(source, () => {
      const data = parseMessage(source, {
        privateAnnotation(src, pos) {
          const end = src.indexOf('}', pos);
          return {
            annotation: { type: 'private' },
            pos: end
          };
        }
      });
      expect(data).toEqual({
        type: 'message',
        declarations: [],
        pattern: [{ type: 'expression', annotation: { type: 'private' } }]
      });
    });
  }

  test('foo {&bar @baz}', () => {
    const data = parseMessage('foo {&bar @baz}', {
      privateAnnotation(src, pos) {
        const end = src.indexOf(' ', pos);
        return {
          annotation: { type: 'priv-bar' },
          pos: end
        };
      }
    });
    expect(data).toEqual({
      type: 'message',
      declarations: [],
      pattern: [
        'foo ',
        {
          type: 'expression',
          annotation: { type: 'priv-bar' },
          attributes: new Map([['baz', true]])
        }
      ]
    });
  });
});
