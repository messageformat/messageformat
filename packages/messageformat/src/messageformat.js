import Formatters from 'messageformat-formatters';
import * as Runtime from 'messageformat-runtime';
import { property } from 'safe-identifier';
import Compiler from './compiler';
import { getAllPlurals, getPlural } from './plurals';
import { stringifyDependencies, stringifyObject } from './stringify';

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
   * `locale` defines the locale or locales supported by this MessageFormat
   * instance. If given multiple valid locales, the first will be the default.
   * If `locale` is empty, it will fall back to `MessageFormat.defaultLocale`.
   *
   * String `locale` values will be matched to plural categorisation functions
   * provided by the Unicode CLDR. If defining your own instead, use named
   * functions instead, optionally providing them with the properties:
   * `cardinals: string[]`, `ordinals: string[]`, `getSource: () => string`.
   *
   * If `locale` has the special value `'*'`, it will match *all* available
   * locales. This may be useful if you want your messages to be completely
   * determined by your data, but may provide surprising results if your
   * input message object includes any 2-3 character keys that are not locale
   * identifiers.
   *
   * @class MessageFormat
   * @classdesc MessageFormat-to-JavaScript compiler
   * @param {string|string[]|function[]} [locale] - The locale(s) to use
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
    if (locale === '*') {
      this.plurals = getAllPlurals(MessageFormat.defaultLocale);
    } else if (Array.isArray(locale)) {
      this.plurals = locale.map(getPlural).filter(Boolean);
    } else if (locale) {
      const pl = getPlural(locale);
      if (pl) this.plurals = [pl];
    }
    if (!this.plurals || this.plurals.length === 0) {
      const pl = getPlural(MessageFormat.defaultLocale);
      this.plurals = [pl];
    }
  }

  /**
   * @typedef {Object} MessageFormat~ResolvedOptions
   * @property {boolean} biDiSupport - Whether Unicode control characters be
   *   added to all input parts to preserve the integrity of the output when
   *   mixing LTR and RTL text
   * @property {object} customFormatters - Map of custom formatting functions
   * @property {string} locale - The default locale
   * @property {object[]} plurals - All of the supported plurals
   * @property {boolean} strictNumberSign - Is `#` only allowed directly within
   *   a plural or selectordinal case
   */

  /**
   * Returns a new object with properties reflecting the default locale,
   * plurals, and other options computed during initialization.
   *
   * @returns {MessageFormat~ResolvedOptions}
   */
  resolvedOptions() {
    return {
      ...this.options,
      locale: this.plurals[0].locale,
      plurals: this.plurals
    };
  }

  /** @private */
  getFormatter(key) {
    const cf = this.options.customFormatters[key];
    if (cf) return cf;
    const df = Formatters[key];
    if (df) return df(this);
    throw new Error(`Formatting function ${JSON.stringify(key)} not found`);
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
   * If this MessageFormat instance has been initialized with support for more
   * than one locale, using a key that matches the locale's identifier at any
   * depth of a `messages` object will set its child elements to use that locale.
   *
   * @memberof MessageFormat
   * @instance
   * @param {string|Object} messages - The input message(s) to be compiled, in ICU MessageFormat
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
  compile(messages) {
    const compiler = new Compiler(this);
    const plural = this.plurals[0];

    if (typeof messages !== 'object') {
      const numFn = this.options.strictNumberSign ? 'strictNumber' : 'number';
      const fn = new Function(
        numFn,
        'plural',
        'select',
        'fmt',
        plural.id,
        'return ' + compiler.compile(messages, plural)
      );
      return fn(
        Runtime[numFn],
        Runtime.plural,
        Runtime.select,
        compiler.formatters,
        plural.getCategory
      );
    }

    const cp = {};
    if (this.plurals.length > 1)
      for (const pl of this.plurals) cp[pl.lc] = cp[pl.locale] = pl;
    const obj = compiler.compile(messages, plural, cp);
    const rtStr = stringifyDependencies(compiler, this.plurals);
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
  else { ${property('root', global)} = G; }
})(this, ${objStr});`;
      }
    };
    return result;
  }
}
