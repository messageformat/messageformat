import testCore from '~/test/messageformat-wg/test/test-core.json';
import testFunctions from '~/test/messageformat-wg/test/test-functions.json';
import { testName } from '~/test/util-test-name.js';
import { parseMessage, validate } from '../index.js';

for (const [title, messages] of [
  ['Parse data model of core messages', testCore] as const,
  ...Object.entries(testFunctions).map(
    x => [`Parse data model of :${x[0]} messages`, x[1]] as const
  )
]) {
  describe(title, () => {
    for (const testMsg of messages) {
      const tx = testMsg.only ? test.only : test;
      tx(testName(testMsg), () => {
        validate(parseMessage(testMsg.src));
      });
    }
  });
}

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
        { type: 'expression', annotation: { type: 'priv-bar' } }
      ]
    });
  });
});
