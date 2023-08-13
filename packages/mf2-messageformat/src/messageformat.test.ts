import testMessages from './__fixtures/test-messages.json';
import { testName } from './__fixtures/test-name';
import { MessageSyntaxError } from './errors';
import { MessageFormat } from './messageformat';

export type TestMessage =
  | {
      src: string;
      exp: string;
      only?: boolean;
      params?: Record<string, string | number | null | undefined>;
      errors?: Array<{ type: string }>;
      locale?: string;
      syntaxError?: never;
    }
  | { src: string; syntaxError: true };

describe('Format messages', () => {
  for (const testMsg of testMessages as TestMessage[]) {
    if (testMsg.syntaxError) {
      expect(() => new MessageFormat(testMsg.src)).toThrow(MessageSyntaxError);
    } else {
      const { src, exp, locale, params, errors: expErrors, only } = testMsg;
      (only ? test.only : test)(testName(testMsg), () => {
        const errors: any[] = [];
        const mf = new MessageFormat(src, locale ?? 'en');
        const msg = mf.format(params, err => errors.push(err));
        expect(msg).toBe(exp);
        expect(errors).toMatchObject(expErrors ?? []);
      });
    }
  }
});
