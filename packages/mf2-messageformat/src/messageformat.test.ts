import { MessageFormat } from './messageformat';
import testMessages from './__fixtures/test-messages.json';
import { testName } from './__fixtures/test-name';

describe('Format messages', () => {
  for (const testMsg of testMessages) {
    test(testName(testMsg), () => {
      const { src, exp, locale, params, errors: expErrors } = testMsg;
      const errors: any[] = [];
      const mf = new MessageFormat(src, locale ?? 'en');
      const msg = mf.resolveMessage(params, err => errors.push(err));
      expect(String(msg)).toBe(exp);
      expect(errors).toMatchObject(expErrors ?? []);
    });
  }
});
