import syntaxErrors from './__fixtures/syntax-errors.json';
import testCore from './__fixtures/test-core.json';
import testFunctions from './__fixtures/test-functions.json';
import { testName } from './__fixtures/util-test-name.js';
import {
  MessageFormat,
  MessageSyntaxError,
  messageFromCST,
  parseMessage,
  parseCST
} from './index.js';

describe('Syntax errors', () => {
  for (const src of syntaxErrors) {
    test(src, () => {
      expect(() => new MessageFormat(src)).toThrow(MessageSyntaxError);
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
            expect(msg).toBe(exp);
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
