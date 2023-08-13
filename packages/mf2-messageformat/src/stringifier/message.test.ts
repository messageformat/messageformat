import testMessages from '../__fixtures/test-messages.json';
import { testName } from '../__fixtures/test-name';
import { asDataModel, parseMessage } from '../cst-parser/index.js';
import { stringifyMessage } from './message';

describe('Stringify messages', () => {
  for (const testMsg of testMessages) {
    if (!testMsg.syntaxError && !testMsg.errors?.length) {
      test(testName(testMsg), () => {
        const msg0 = asDataModel(parseMessage(testMsg.src));
        const src1 = stringifyMessage(msg0);
        const msg1 = asDataModel(parseMessage(src1));
        expect(msg1).toEqual(msg0);
      });
    }
  }
});
