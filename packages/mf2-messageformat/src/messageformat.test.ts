import dataModelErrors from '~/test/messageformat-wg/test/data-model-errors.json';
import syntaxErrors from '~/test/messageformat-wg/test/syntax-errors.json';
import testCore from '~/test/messageformat-wg/test/test-core.json';
import testFunctions from '~/test/messageformat-wg/test/test-functions.json';
import { testName } from '~/test/util-test-name.js';
import {
  MessageDataModelError,
  MessageFormat,
  MessageSyntaxError,
  messageFromCST,
  parseCST,
  parseMessage
} from './index.js';

describe('Syntax errors', () => {
  for (const src of syntaxErrors) {
    test(src, () => {
      expect(() => new MessageFormat(src)).toThrow(MessageSyntaxError);
    });
  }
});

describe('Data model errors', () => {
  for (const [name, errors] of Object.entries(dataModelErrors)) {
    describe(name, () => {
      for (const src of errors) {
        test(src, () => {
          expect(() => new MessageFormat(src)).toThrow(MessageDataModelError);
        });
      }
    });
  }
});

for (const [parserName, parse] of [
  ['Built-in parser', src => src],
  ['CST parser', src => messageFromCST(parseCST(src))],
  ['Data model parser', parseMessage]
] as Array<[string, (src: string) => any]>) {
  describe(parserName, () => {
    for (const [title, messages] of [
      ['Core message syntax', testCore] as const,
      ...Object.entries(testFunctions).map(
        x => [`Messages using :${x[0]}`, x[1]] as const
      )
    ]) {
      describe(title, () => {
        for (const testMsg of messages) {
          const {
            src,
            exp,
            parts,
            locale,
            params,
            errors: expErrors,
            only
          } = testMsg;
          (only ? test.only : test)(testName(testMsg), () => {
            let errors: any[] = [];
            const mf = new MessageFormat(parse(src), locale ?? 'en');
            const msg = mf.format(params, err => errors.push(err));
            if (typeof exp === 'string') expect(msg).toBe(exp);
            expect(errors).toMatchObject(expErrors ?? []);
            if (parts) {
              errors = [];
              const mp = mf.formatToParts(params, err => errors.push(err));
              expect(mp).toMatchObject(parts);
              expect(errors).toMatchObject(expErrors ?? []);
            }
          });
        }
      });
    }
  });
}
