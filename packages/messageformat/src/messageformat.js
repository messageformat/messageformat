import Formatters from 'messageformat-formatters';
import * as Runtime from 'messageformat-runtime';
import Compiler from './compiler';
import stringifyDependencies from './stringify-dependencies';
import { funcname, propname } from './utils';
import { getAllPlurals, getPlural } from './plurals';

function stringifyObject(obj, level) {
  if (!level) level = 0;
  if (typeof obj != 'object') return obj;
  let indent = '';
  for (let i = 0; i < level; ++i) indent += '  ';
  const o = [];
  for (const k in obj) {
    const v = stringifyObject(obj[k], level + 1);
    o.push(`\n${indent}  ${propname(k)}: ${v}`);
  }
  return `{${o.join(',')}\n${indent}}`;
}

export default class MessageFormat {
  /**
   * The default locale
   *
   * Used by the constructor when no `locale` has been set to initialise the value
   * of its instance counterpart, `MessageFormat#defaultLocale`.
   *
   * @memberof MessageFormat
   * @default 'en'
   */
  static defaultLocale = 'en';

  /** Escape special characaters
   *
   *  Surround the characters `{` and `}` in the input string with 'quotes'.
   *  This will allow those characters to not be considered as MessageFormat
   *  control characters.
   *
   * @memberof MessageFormat
   * @param {string} str - The input string
   * @param {boolean} [octothorpe=false] - Include `#` in the escaped characters
   * @returns {string} The escaped string
   */
  static escape(str, octothorpe) {
    const esc = octothorpe ? /[#{}]/g : /[{}]/g;
    return String(str).replace(esc, "'$&'");
  }

  /**
   * Create a new MessageFormat compiler
   *
   * If set, the `locale` parameter limits the compiler to use a subset of the 204
   * languages' pluralisation rules made available by the Unicode CLDR.
   *
   * Leaving `locale` undefined or using an array of strings will create a
   * MessageFormat instance with multi-language support. To select which to use,
   * use the second parameter of `{@link MessageFormat#compile compile()}`, or use
   * message keys corresponding to your locales. The default locale will be the
   * first entry of the array, or `{@link MessageFormat.defaultLocale defaultLocale}`
   * if not set.
   *
   * A string `locale` will create a single-locale MessageFormat instance.
   *
   * Using an object `locale` with all properties of type `function` allows for
   * the use of custom or externally defined pluralisation rules; in this case
   *
   * @class MessageFormat
   * @classdesc MessageFormat-to-JavaScript compiler
   * @param {string|string[]|Object} [locale] - The locale(s) to use
   * @param {Object} [options] - Compiler options
   * @param {('string'|'values')} [options.returnType='string'] - Return type of
   *   compiled functions; either a concatenated string or an array (possibly
   *   hierarchical) of values
   * @param {boolean} [options.biDiSupport=false] - Add Unicode control
   *   characters to all input parts to preserve the integrity of the output
   *   when mixing LTR and RTL text
   * @param {Object} [options.customFormatters] - Map of custom formatting
   *   functions to include. See the {@tutorial guide} for more details.
   * @param {boolean} [options.strictNumberSign=false] - Allow `#` only directly
   *   within a plural or selectordinal case, rather than in any inner select
   *   case as well.
   *
   * ```
   * import MessageFormat from 'messageformat'
   * ```
   */
  constructor(locale, options) {
    this.options = Object.assign(
      {
        biDiSupport: false,
        customFormatters: {},
        returnType: 'string',
        strictNumberSign: false
      },
      options
    );
    this.pluralFuncs = {};
    if (typeof locale === 'string') {
      this.pluralFuncs[locale] = getPlural(locale);
      this.defaultLocale = locale;
    } else if (Array.isArray(locale)) {
      locale.forEach(lc => {
        this.pluralFuncs[lc] = getPlural(lc);
      });
      this.defaultLocale = locale[0];
    } else {
      if (locale) {
        const lcKeys = Object.keys(locale);
        for (let i = 0; i < lcKeys.length; ++i) {
          const lc = lcKeys[i];
          if (typeof locale[lc] !== 'function') {
            throw new Error(`Expected function value for locale ${lc}`);
          }
          this.pluralFuncs[lc] = locale[lc];
          if (!this.defaultLocale) this.defaultLocale = lc;
        }
      }
      if (this.defaultLocale) {
        this.hasCustomPluralFuncs = true;
      } else {
        this.defaultLocale = MessageFormat.defaultLocale;
        this.hasCustomPluralFuncs = false;
      }
    }
  }

  /** @private */
  getFormatter(key) {
    const cf = this.options.customFormatters[key];
    if (cf) return cf;
    const df = Formatters[key];
    if (df) return df(this);
    throw new Error(`Formatting function ${JSON.stringify(key)} not found`);
  }

  /** @private */
  getPluralFuncs(locale) {
    if (Object.keys(this.pluralFuncs).length === 0) {
      if (locale) {
        // no locale in ctor, but given as compile() arg
        const pf = getPlural(locale);
        if (!pf) throw new Error(`Locale ${JSON.stringify(locale)} not found`);
        return { locale, pluralFuncs: { [locale]: pf } };
      } else {
        // no locale at all
        return { locale: this.defaultLocale, pluralFuncs: getAllPlurals() };
      }
    } else if (locale) {
      // locales defined in ctor as well as compile() args
      const pf = this.pluralFuncs[locale];
      if (!pf) {
        const pfk = JSON.stringify(Object.keys(this.pluralFuncs));
        throw new Error(`Locale ${JSON.stringify(locale)} not found in ${pfk}`);
      }
      return { locale, pluralFuncs: { [locale]: pf } };
    } else {
      // locales defined in ctor but not in compile() args
      return { locale: this.defaultLocale, pluralFuncs: this.pluralFuncs };
    }
  }

  /**
   * Compile messages into storable functions
   *
   * If `messages` is a single string including ICU MessageFormat declarations,
   * the result of `compile()` is a function taking a single Object parameter
   * `d` representing each of the input's defined variables.
   *
   * If `messages` is a hierarchical structure of such strings, the output of
   * `compile()` will match that structure, with each string replaced by its
   * corresponding JavaScript function.
   *
   * If the input `messages` -- and therefore the output -- of `compile()` is an
   * object, the output object will have a `toString(global)` method that may be
   * used to store or cache the compiled functions to disk, for later inclusion
   * in any JS environment, without a local MessageFormat instance required. If
   * its `global` parameter is null or undefined, the result is an ES6 module
   * with a default export. If `global` is a string containing `.`, the result
   * will be a script setting its value. Otherwise, the output defaults to an UMD
   * pattern that sets the value of `global` if used outside of AMD and CommonJS
   * loaders.
   *
   * If `locale` is not set, it will default to
   * `{@link MessageFormat.defaultLocale defaultLocale}`; using a key at any
   * depth of `messages` that is a declared locale will set its child elements to
   * use that locale.
   *
   * If `locale` is set, it is used for all messages, ignoring any otherwise
   * matching locale keys. If the constructor declared any locales, `locale`
   * needs to be one of them.
   *
   * If `compile()` is called with a `messages` object on a MessageFormat
   * instance that does not specify any locales, it will match keys to *all* 204
   * available locales. This is really useful if you want your messages to be
   * completely determined by your data, but may provide surprising results if
   * your input includes any 2-3 letter strings that are not locale identifiers.
   *
   * @memberof MessageFormat
   * @instance
   * @param {string|Object} messages - The input message(s) to be compiled, in ICU MessageFormat
   * @param {string} [locale] - A locale to use for the messages
   * @returns {function|Object} The first match found for the given locale(s)
   *
   * @example
   * const mf = new MessageFormat('en')
   * const msg = mf.compile('A {TYPE} example.')
   *
   * msg({ TYPE: 'simple' })  // 'A simple example.'
   *
   * @example
   * const mf = new MessageFormat(['en', 'fi'])
   * const messages = mf.compile({
   *   en: { a: 'A {TYPE} example.',
   *         b: 'This is the {COUNT, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} example.' },
   *   fi: { a: '{TYPE} esimerkki.',
   *         b: 'Tämä on {COUNT, selectordinal, other{#.}} esimerkki.' }
   * })
   *
   * messages.en.b({ COUNT: 2 })  // 'This is the 2nd example.'
   * messages.fi.b({ COUNT: 2 })  // 'Tämä on 2. esimerkki.'
   *
   * @example
   * const fs = require('fs')
   * const mf = new MessageFormat('en')
   * const msgSet = {
   *   a: 'A {TYPE} example.',
   *   b: 'This has {COUNT, plural, one{one member} other{# members}}.',
   *   c: 'We have {P, number, percent} code coverage.'
   * }
   * const msgStr = mf.compile(msgSet).toString('module.exports')
   * fs.writeFileSync('messages.js', msgStr)
   *
   * ...
   *
   * const messages = require('./messages')
   *
   * messages.a({ TYPE: 'more complex' })  // 'A more complex example.'
   * messages.b({ COUNT: 3 })              // 'This has 3 members.'
   */
  compile(messages, lc) {
    const { locale, pluralFuncs } = this.getPluralFuncs(lc);
    const compiler = new Compiler(this);
    const obj = compiler.compile(messages, locale, pluralFuncs);

    if (typeof messages != 'object') {
      const rtNumber = this.options.strictNumberSign
        ? Runtime.strictNumber
        : Runtime.number;
      const fn = new Function(
        `${rtNumber.name}, plural, select, fmt`,
        funcname(locale),
        'return ' + obj
      );
      return fn(
        rtNumber,
        Runtime.plural,
        Runtime.select,
        compiler.formatters,
        pluralFuncs[locale]
      );
    }

    const rtStr = stringifyDependencies(compiler, pluralFuncs);
    const objStr = stringifyObject(obj);
    const result = new Function(`${rtStr}\nreturn ${objStr}`)();
    // eslint-disable-next-line no-prototype-builtins
    if (result.hasOwnProperty('toString'))
      throw new Error('The top-level message key `toString` is reserved');

    result.toString = function(global) {
      if (!global || global === 'export default') {
        return `${rtStr}\nexport default ${objStr}`;
      } else if (global.indexOf('.') > -1) {
        return `${rtStr}\n${global} = ${objStr}`;
      } else {
        return `${rtStr}
(function (root, G) {
  if (typeof define === "function" && define.amd) { define(G); }
  else if (typeof exports === "object") { module.exports = G; }
  else { ${propname(global, 'root')} = G; }
})(this, ${objStr});`;
      }
    };
    return result;
  }
}
