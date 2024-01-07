import testCore from '../__fixtures/test-core.json';
import testFunctions from '../__fixtures/test-functions.json';
import { testName } from '../__fixtures/util-test-name.js';
import type { TestMessage } from '../messageformat.test.js';
import { parseCST, stringifyCST } from '../index.js';

for (const [title, messages] of [
  ['Parse & stringify CST of core messages', testCore],
  ...Object.entries(testFunctions).map(x => [
    `Parse & stringify CST of :${x[0]} messages`,
    x[1]
  ])
] as Array<[string, TestMessage[]]>) {
  describe(title, () => {
    for (const testMsg of messages) {
      test(testName(testMsg), () => {
        const cst = parseCST(testMsg.src);
        expect(cst.errors).toHaveLength(0);
        const src = stringifyCST(cst);
        expect(src.replace(/\n/g, ' ')).toBe(testMsg.cleanSrc ?? testMsg.src);
      });
    }
  });
}
