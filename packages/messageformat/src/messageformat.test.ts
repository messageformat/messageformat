import { getTestCases } from '../../../test/fixtures/messageformat';
import MessageFormat from './messageformat';
import { PluralFunction } from './plurals';

describe('static MessageFormat', () => {
  test('should exist', () => {
    expect(MessageFormat).toBeInstanceOf(Function);
  });

  test('should have a supportedLocalesOf() function', () => {
    expect(MessageFormat.supportedLocalesOf).toBeInstanceOf(Function);
  });

  test('should have a working supportedLocalesOf() function', () => {
    const lc = MessageFormat.supportedLocalesOf(['fi', 'xx', 'en-CA']);
    expect(lc).toMatchObject(['fi', 'en-CA']);
  });
});

describe('new MessageFormat()', () => {
  test('should be a constructor', () => {
    const mf = new MessageFormat('en');
    expect(mf).toBeInstanceOf(MessageFormat);
  });

  test('should have a compile() function', () => {
    const mf = new MessageFormat('en');
    expect(mf.compile).toBeInstanceOf(Function);
  });

  test('should have a resolvedOptions() function', () => {
    const mf = new MessageFormat('en');
    expect(mf.resolvedOptions).toBeInstanceOf(Function);
  });

  test('should fallback when a base pluralFunc exists', () => {
    const mf = new MessageFormat('en-x-test1-test2');
    const opt = mf.resolvedOptions();
    expect(opt.locale).toBe('en-x-test1-test2');
    expect(opt.plurals[0].getPlural).toBeInstanceOf(Function);
  });

  test('should fallback when a base pluralFunc exists (underscores)', () => {
    const mf = new MessageFormat('en_x_test1_test2');
    const opt = mf.resolvedOptions();
    expect(opt.locale).toBe('en_x_test1_test2');
    expect(opt.plurals[0].getPlural).toBeInstanceOf(Function);
  });

  test('should fallback on non-existing locales', () => {
    const mf = new MessageFormat('lawlz');
    const opt = mf.resolvedOptions();
    expect(opt.locale).toBe('en');
  });

  test('should default to `en` when no locale is passed into the constructor', () => {
    const mf = new MessageFormat('lawlz');
    const opt = mf.resolvedOptions();
    expect(opt.locale).toBe('en');
  });

  test('should accept custom plural functions', () => {
    const fake: PluralFunction = (_, ord) => (ord ? 'few' : 'many');
    fake.cardinals = ['many'];
    fake.ordinals = ['few'];
    const mf = new MessageFormat([fake]);
    const opt = mf.resolvedOptions();
    expect(opt.locale).toBe('fake');
    expect(opt.plurals[0].getPlural).toBe(fake);
    expect(opt.plurals[0].cardinals).toBe(fake.cardinals);
    expect(opt.plurals[0].ordinals).toBe(fake.ordinals);
    expect(() => mf.compile('{X, plural, many{a}}')).not.toThrow();
  });

  test('should include all locales for "*"', () => {
    const mf = new MessageFormat('*');
    const opt = mf.resolvedOptions();
    expect(opt.locale).toBe('en');
    expect(opt.plurals.length).toBeGreaterThan(100);
  });
});

describe('compile() errors', () => {
  test('Missing other in select', () => {
    const mf = new MessageFormat('en');
    const src = '{X, select, foo{a}}';
    expect(() => mf.compile(src)).toThrow(/No 'other' form found/);
  });

  test('Missing other in plural', () => {
    const mf = new MessageFormat('en');
    const src = '{X, plural, one{a}}';
    expect(() => mf.compile(src)).toThrow(/No 'other' form found/);
  });

  test('Invalid plural key', () => {
    const mf = new MessageFormat('en');
    const src = '{X, plural, foo{a}}';
    expect(() => mf.compile(src)).toThrow(/Invalid key `foo`/);
  });

  test('Invalid selectordinal key', () => {
    const mf = new MessageFormat('en');
    const src = '{X, plural, foo{a}}';
    expect(() => mf.compile(src)).toThrow(/Invalid key `foo`/);
  });

  test('Invalid plural key for locale', () => {
    const mf = new MessageFormat('en');
    const src = '{X, plural, zero{none} one{one} other{some: #}}';
    expect(() => mf.compile(src)).toThrow(/Invalid key `zero`/);
  });

  test('Undefined formatting function', () => {
    const mf = new MessageFormat('en');
    const src = 'This is {VAR,uppercase}.';
    expect(() => mf.compile(src)).toThrow();
  });

  test('Unknown number skeleton stem', () => {
    const mf = new MessageFormat('en');
    const src = '{value, number, :: foo}';
    expect(() => mf.compile(src)).toThrow('Unknown stem: foo');
  });

  test('Number skeleton .00/@@/@@', () => {
    const mf = new MessageFormat('en');
    const src = '{value, number, :: .00/@@/@@}';
    expect(() => mf.compile(src)).toThrow(
      'Token .00 only supports one option (got 2)'
    );
  });
});

const isNode10 = process.version.startsWith('v10')

for (const [title, cases] of Object.entries(getTestCases(MessageFormat))) {
  describe(title, () => {
    for (const { locale, options, src, exp, skip } of cases) {
      if (skip) {
        if (isNode10 && skip.includes('node10')) continue;
      }
      let name = src;
      if (locale || options) {
        const opt = [locale || 'en'];
        for (const [key, value] of Object.entries(options || {}))
          opt.push(`${key}: ${value}`);
        name = `[${opt.join(', ')}] ${src}`;
      }
      describe(name, () => {
        for (const [param, res] of exp) {
          const strParam = [];
          if (param && typeof param === 'object')
            for (const [key, value] of Object.entries(param))
              strParam.push(`${key}: ${value}`);
          else strParam.push(String(param));
          test(strParam.join(', '), () => {
            const mf = new MessageFormat(locale || 'en', options);
            const msg = mf.compile(src);
            if (res && typeof res === 'object' && 'error' in res) {
              if (res.error === true) expect(() => msg(param)).toThrow();
              else expect(() => msg(param)).toThrow(res.error);
            } else if (res instanceof RegExp) {
              expect(msg(param)).toMatch(res);
            } else if (Array.isArray(res)) {
              expect(msg(param)).toMatchObject(res);
            } else {
              expect(msg(param)).toBe(res);
            }
          });
        }
      });
    }
  });
}
