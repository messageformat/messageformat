import syntaxErrors from './__fixtures/syntax-errors.json';
import testCore from './__fixtures/test-core.json';
import testFunctions from './__fixtures/test-functions.json';
import { testName } from './__fixtures/util-test-name.js';
import { MessageSyntaxError } from './errors.js';
import { MessageFormat } from './messageformat.js';

export type TestMessage = {
  src: string;
  only?: boolean;
  locale?: string;
  params?: Record<string, string | number | null | undefined>;
  exp: string;
  parts?: Array<object>;
  cleanSrc?: string;
  errors?: Array<{ type: string }>;
};

describe('Syntax errors', () => {
  for (const src of syntaxErrors) {
    test(src, () => {
      expect(() => new MessageFormat(src)).toThrow(MessageSyntaxError);
    });
  }
});

for (const [title, messages] of [
  ['Core message syntax', testCore],
  ...Object.entries(testFunctions).map(x => [`Messages using :${x[0]}`, x[1]])
] as Array<[string, TestMessage[]]>) {
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
        const mf = new MessageFormat(src, locale ?? 'en');
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
