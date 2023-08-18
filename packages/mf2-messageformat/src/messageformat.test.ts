import testMessages from './__fixtures/test-messages.json';
import { testName } from './__fixtures/test-name';
import { MessageSyntaxError } from './errors';
import { MessageFormat } from './messageformat';

export type TestMessage =
  | {
      src: string;
      only?: boolean;
      locale?: string;
      params?: Record<string, string | number | null | undefined>;
      exp: string;
      parts?: Array<object>;
      errors?: Array<{ type: string }>;
      syntaxError?: never;
    }
  | { src: string; syntaxError: true };

describe('Format messages', () => {
  for (const testMsg of testMessages as TestMessage[]) {
    if (testMsg.syntaxError) {
      expect(() => new MessageFormat(testMsg.src)).toThrow(MessageSyntaxError);
    } else {
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
  }
});
