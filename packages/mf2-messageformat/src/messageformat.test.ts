import { MessageFormat } from './messageformat';
import tests from './__fixtures/test-messages.json';

describe('Formatted messages', () => {
  for (const { src, exp, locale, params, errors: expErrors } of tests) {
    let name = src;
    if (locale) name += ` [${locale}]`;
    if (params)
      name += ` {${Object.entries(params)
        .map(p => ` ${p[0]}: ${p[1]}`)
        .join()} }`;
    test(name.replace(/ *\n */g, ' '), () => {
      const errors: any[] = [];
      const mf = new MessageFormat(src, locale ?? 'en');
      const msg = mf.resolveMessage(params, err => errors.push(err));
      expect(String(msg)).toBe(exp);
      expect(errors).toMatchObject(expErrors ?? []);
    });
  }
});
