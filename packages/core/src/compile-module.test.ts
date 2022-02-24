import compileModule from './compile-module';
import MessageFormat from './messageformat';
import { getModule } from '../../../test/fixtures/get-message-module';
import { PluralFunction } from './plurals';

const NODE_VERSION =
  typeof process === 'undefined' ? 99 : parseInt(process.version.slice(1));

describe('compileModule()', function () {
  it('can compile an object of messages', async function () {
    const data = {
      key: 'I have {FRIENDS, plural, one{one friend} other{# friends}}.'
    };
    const mf = new MessageFormat('en');
    const mfunc = await getModule(mf, data);
    expect(mfunc).toBeInstanceOf(Object);
    expect(mfunc.key).toBeInstanceOf(Function);
    expect(mfunc.key({ FRIENDS: 1 })).toBe('I have one friend.');
    expect(mfunc.key({ FRIENDS: 2 })).toBe('I have 2 friends.');
  });

  it('can compile an object enclosing reserved JavaScript words used as keys in quotes', async function () {
    const data = {
      default: 'default is a JavaScript reserved word so should be quoted',
      unreserved:
        'unreserved is not a JavaScript reserved word so should not be quoted'
    };
    const mf = new MessageFormat('en');
    const mfunc = await getModule(mf, data);

    expect(mfunc['default']).toBeInstanceOf(Function);
    expect(mfunc['default']()).toBe(
      'default is a JavaScript reserved word so should be quoted'
    );

    expect(mfunc.unreserved).toBeInstanceOf(Function);
    expect(mfunc.unreserved()).toBe(
      'unreserved is not a JavaScript reserved word so should not be quoted'
    );
  });

  it('can be instantiated multiple times', async function () {
    const mf = { en: new MessageFormat('en'), ru: new MessageFormat('ru') };
    const cf = {
      en: await getModule(mf.en, {
        msg: '{count} {count, plural, other{users}}'
      }),
      ru: await getModule(mf.ru, {
        msg: '{count} {count, plural, other{пользователей}}'
      })
    };
    expect(function () {
      cf.en.msg({ count: 12 });
    }).not.toThrow();
    expect(cf.en.msg({ count: 12 })).toBe('12 users');
    expect(function () {
      cf.ru.msg({ count: 13 });
    }).not.toThrow();
    expect(cf.ru.msg({ count: 13 })).toBe('13 пользователей');
  });

  describe('multiple languages', () => {
    it('basic support', async function () {
      const mf = new MessageFormat(['en', 'fr', 'ru'], {
        customFormatters: { lc: (v, lc) => lc }
      });
      const cf = await getModule(mf, {
        fr: 'Locale: {_, lc}',
        ru: '{count, plural, one{1} few{2} many{3} other{x:#}}'
      });
      expect(cf.fr({})).toBe('Locale: fr');
      expect(cf.ru({ count: 12 })).toBe('3');
    });

    it('defaults to supporting only English', async function () {
      const mf = new MessageFormat(null, {
        customFormatters: { lc: (v, lc) => lc }
      });
      const cf = await getModule(mf, {
        xx: 'Locale: {_, lc}',
        fr: 'Locale: {_, lc}'
      });
      expect(cf.xx({})).toBe('Locale: en');
      expect(cf.fr({})).toBe('Locale: en');
    });

    it('supports all languages with locale "*"', async function () {
      const mf = new MessageFormat('*', {
        customFormatters: { lc: (v, lc) => lc }
      });
      const cf = await getModule(mf, {
        fr: 'Locale: {_, lc}',
        xx: 'Locale: {_, lc}',
        ru: '{count, plural, one{1} few{2} many{3} other{x:#}}'
      });
      expect(cf.fr({})).toBe('Locale: fr');
      expect(cf.xx({})).toBe('Locale: en');
      expect(cf.ru({ count: 12 })).toBe('3');
    });
  });

  describe('custom plurals', () => {
    it('should import cardinal-only plural by default', async () => {
      const mf = new MessageFormat('en');
      const msg = '{foo, plural, one{one} other{other}}';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(
        /import { en } from "@messageformat\/runtime\/lib\/cardinals"/
      );
    });

    it('should import combined plural if required', async () => {
      const mf = new MessageFormat('en');
      const msg = '{foo, selectordinal, one{one} other{other}}';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(
        /import { en } from "@messageformat\/runtime\/lib\/plurals"/
      );
    });

    it('should inline custom plural by default', async () => {
      const lc: PluralFunction = function lc() {
        return 'other';
      };
      const mf = new MessageFormat(lc);
      const msg = '{foo, plural, one{one} other{other}}';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(/\bfunction lc\b/);
    });

    it('should import custom plural if defined with module', async () => {
      const lc: PluralFunction = () => 'other';
      lc.module = 'custom-module';
      const mf = new MessageFormat(lc);
      const msg = '{foo, plural, one{one} other{other}}';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(/import { lc } from "custom-module"/);
    });
  });

  describe('message selectors', () => {
    it('select', async () => {
      const mf = new MessageFormat('en');
      const msg = await getModule(mf, {
        0: '{x, select, one{one} other{other}}'
      });
      expect(msg[0]({ x: 'one' })).toBe('one');
      expect(msg[0]({ x: 1 })).toBe('other');
      expect(msg[0]({ x: 2 })).toBe('other');
    });

    it('plural', async () => {
      const mf = new MessageFormat('en');
      const msg = await getModule(mf, {
        0: '{x, plural, one{one} other{other}}'
      });
      expect(msg[0]({ x: 1 })).toBe('one');
      expect(msg[0]({ x: 2 })).toBe('other');
    });

    it('selectordinal', async () => {
      const mf = new MessageFormat('en');
      const msg = await getModule(mf, {
        0: '{x, selectordinal, one{one} two{two} other{other}}'
      });
      expect(msg[0]({ x: 1 })).toBe('one');
      expect(msg[0]({ x: 2 })).toBe('two');
      expect(msg[0]({ x: 3 })).toBe('other');
    });
  });

  describe('spec formatters', () => {
    it('number', async () => {
      const mf = new MessageFormat('en');
      const msg = await getModule(mf, {
        0: 'This is {VAR, number, integer}.',
        1: 'Other {VAR, number, {type}}.'
      });
      expect(msg[0]({ VAR: 3.14 })).toBe('This is 3.');
      expect(msg[1]({ VAR: 3.14, type: 'integer' })).toBe('Other 3.');
    });

    it('date', async () => {
      const mf = new MessageFormat('en');
      const msg = await getModule(mf, {
        0: 'Today is {T, date}',
        1: 'The year is {T, date, ::y}'
      });
      const T = new Date(2016, 1, 21);
      expect(msg[0]({ T })).toBe('Today is Feb 21, 2016');
      expect(msg[1]({ T })).toBe('The year is 2016');
    });
  });

  describe('custom formatters', () => {
    it('basic support', async function () {
      const mf = new MessageFormat('en', {
        customFormatters: { uppercase: v => String(v).toUpperCase() }
      });
      const msg = await getModule(mf, {
        0: 'This is {VAR,uppercase}.',
        1: 'Other string'
      });
      expect(msg[0]({ VAR: 'big' })).toBe('This is BIG.');
    });

    if (NODE_VERSION >= 12) {
      it('supports number formatters', async function () {
        const mf = new MessageFormat('en');
        const msg = await getModule(mf, {
          0: 'Your balance is {VAR, number, ¤#,##0.00;(¤#,##0.00)}.',
          1: 'The sparrow flew {VAR, number, :: measure-unit/length-meter unit-width-full-name}'
        });
        expect(msg[0]({ VAR: -3.27 })).toBe('Your balance is ($3.27).');
        expect(msg[1]({ VAR: 42 })).toBe('The sparrow flew 42 meters');
      });
    }

    it('import from module; id == key', async () => {
      const upcase = {
        formatter: (v: unknown) => String(v).toUpperCase(),
        id: 'upcase',
        module: 'upmod'
      };
      const mf = new MessageFormat('en', { customFormatters: { upcase } });
      const msg = '{foo, upcase}';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(/import { upcase } from "upmod"/);
    });

    it('import from module; id != key', async () => {
      const upcase = {
        formatter: (v: unknown) => String(v).toUpperCase(),
        id: 'upperCase',
        module: 'upmod'
      };
      const mf = new MessageFormat('en', { customFormatters: { upcase } });
      const msg = '{foo, upcase}';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(/import { upperCase as upcase } from "upmod"/);
    });

    it('defaults to string arg', () => {
      const upcase = {
        formatter: (v: unknown) => String(v).toUpperCase()
      };
      const mf = new MessageFormat('en', { customFormatters: { upcase } });
      const msg = '{foo, upcase, arg {x} }';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(
        /upcase\([^)]+, \(" arg " \+ d\.x \+ " "\).trim\(\)\)/
      );
    });

    it('handles empty string arg', () => {
      const upcase = {
        formatter: (v: unknown) => String(v).toUpperCase()
      };
      const mf = new MessageFormat('en', { customFormatters: { upcase } });
      const msg = '{foo, upcase,}';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(/upcase\([^)]+, ""\)/);
    });

    it('arg: "raw"', () => {
      const upcase = {
        formatter: (v: unknown) => String(v).toUpperCase(),
        arg: 'raw'
      } as const;
      const mf = new MessageFormat('en', { customFormatters: { upcase } });
      const msg = '{foo, upcase, arg {x} }';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(/upcase\([^)]+, \[" arg ", d\.x, " "\]\)/);
    });

    it('arg: "options"', () => {
      const upcase = {
        formatter: (v: unknown) => String(v).toUpperCase(),
        arg: 'options'
      } as const;
      const mf = new MessageFormat('en', { customFormatters: { upcase } });
      const msg =
        '{foo, upcase, num: 1, foo:foo,foo:bar, true:true, false:  false,\tnull\n:\n\nnull,x }';
      const src = compileModule(mf, { msg });
      expect(src).toMatch(
        /upcase\([^)]+, {"num":1,"foo":"bar","true":true,"false":false,"null":null,"x":null}\)/
      );
    });

    it('arg: "options" requires literal value', () => {
      const upcase = {
        formatter: (v: unknown) => String(v).toUpperCase(),
        arg: 'options'
      } as const;
      const mf = new MessageFormat('en', { customFormatters: { upcase } });
      const msg = '{foo, upcase, arg:1,foo:{x} }';
      expect(() => compileModule(mf, { msg })).toThrow(
        'Expected literal options for upcase formatter'
      );
    });

    it('allows overriding default formatters', async () => {
      const number = (v: unknown) => Number(v) + 2;
      const mf = new MessageFormat('en', { customFormatters: { number } });
      const cf = await getModule(mf, { msg: 'one and one is {one, number}' });
      expect(cf.msg({ one: 1 })).toBe('one and one is 3');
    });

    it('complains if trying to use a reserved word as key', () => {
      const number = (v: unknown) => Number(v) + 2;
      const mf = new MessageFormat('en', {
        customFormatters: { switch: number }
      });
      const msg = '{foo, switch}';
      expect(() => compileModule(mf, { msg })).toThrow(
        'Reserved word used as formatter identifier: switch'
      );
    });

    it('complains if trying to override a plural function', () => {
      const number = (v: unknown) => Number(v) + 2;
      const mf = new MessageFormat('en', {
        customFormatters: { en: number }
      });
      const msg1 = '{foo, plural, other{fff}}';
      const msg2 = '{foo, en}';
      expect(() => compileModule(mf, { msg1, msg2 })).toThrow(
        'Cannot override locale runtime function as formatter: en'
      );
    });
  });

  describe('locale variants', () => {
    it('valid variants', async () => {
      const mf = new MessageFormat("*");
      const mp = {
        "en-US": {
          key: 'en-US'
        },
        "es-MX": {
          key: "en-MX"
        },
        "es-ES": {
          key: "en-ES"
        }
      }

      const m = await getModule(mf, mp);

      expect(m['en-US']['key']()).toEqual("en-US");
      expect(m['es-MX']['key']()).toEqual("en-MX");
      expect(m['es-ES']['key']()).toEqual("en-ES");
    });

    it('valid variants', async () => {
      const mf = new MessageFormat("*");
      const mp = {
        "en-US": {
          key: 'en-US'
        },
        "es-MX": {
          key: "en-MX"
        },
        "es-ES": {
          key: "en-ES"
        }
      }

      const m = await getModule(mf, mp);
      expect(m['en-US']['key']()).toEqual("en-US");
      expect(m['es-MX']['key']()).toEqual("en-MX");
      expect(m['es-ES']['key']()).toEqual("en-ES");
    });

    it('mixed variants', async () => {
      const mf = new MessageFormat("*");
      const mp = {
        "en": {
          key: 'en'
        },
        "es-MX": {
          key: "en-MX"
        },
      }

      const m = await getModule(mf, mp);
      expect(m['en']['key']()).toEqual("en");
      expect(m['es-MX']['key']()).toEqual("en-MX");
    });
  })
});
