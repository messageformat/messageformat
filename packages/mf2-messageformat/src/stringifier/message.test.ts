import testCore from '../__fixtures/test-core.json';
import testFunctions from '../__fixtures/test-functions.json';
import { testName } from '../__fixtures/util-test-name';
import { asDataModel, parseMessage } from '../cst-parser/index.js';
import type { TestMessage } from '../messageformat.test';
import { stringifyMessage } from './message';

for (const [title, messages] of [
  ['Stringify core messages', testCore],
  ...Object.entries(testFunctions).map(x => [
    `Stringify :${x[0]} messages`,
    x[1]
  ])
] as Array<[string, TestMessage[]]>) {
  describe(title, () => {
    for (const testMsg of messages) {
      if (!testMsg.errors?.length) {
        test(testName(testMsg), () => {
          const msg0 = asDataModel(parseMessage(testMsg.src));
          const src1 = stringifyMessage(msg0);
          const msg1 = asDataModel(parseMessage(src1));
          expect(msg1).toEqual(msg0);
        });
      }
    }
  });
}
