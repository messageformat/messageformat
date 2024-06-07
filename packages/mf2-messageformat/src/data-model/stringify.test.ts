import testCore from '~/test/messageformat-wg/test/test-core.json';
import testFunctions from '~/test/messageformat-wg/test/test-functions.json';
import { testName } from '~/test/util-test-name.js';
import {
  type Message,
  cst,
  messageFromCST,
  parseCST,
  stringifyMessage,
  visit
} from '../index.js';

function trimCST(msg: Message) {
  delete msg[cst];
  visit(msg, {
    node(node) {
      delete node[cst];
    }
  });
}

for (const [title, messages] of [
  ['Stringify core messages', testCore] as const,
  ...Object.entries(testFunctions).map(
    x => [`Stringify :${x[0]} messages`, x[1]] as const
  )
]) {
  describe(title, () => {
    for (const testMsg of messages) {
      if (!testMsg.errors?.length) {
        test(testName(testMsg), () => {
          const msg0 = messageFromCST(parseCST(testMsg.src));
          trimCST(msg0);
          const src1 = stringifyMessage(msg0);
          const msg1 = messageFromCST(parseCST(src1));
          trimCST(msg1);
          expect(msg1).toEqual(msg0);
        });
      }
    }
  });
}
