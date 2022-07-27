import { parseMessage } from '../parser/message';
import testMessages from '../__fixtures/test-messages.json';
import { testName } from '../__fixtures/test-name';
import { stringifyMessage } from './message';

describe('Stringify messages', () => {
  for (const testMsg of testMessages) {
    if (!testMsg.errors || testMsg.errors.length === 0) {
      test(testName(testMsg), () => {
        const msg = parseMessage(testMsg.src);
        const res = stringifyMessage(msg);
        expect(res.replace(/\n/g, ' ')).toBe(testMsg.src);
      });
    }
  }
});
