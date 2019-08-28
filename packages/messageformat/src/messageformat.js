import Formatters from 'messageformat-formatters';
import * as Runtime from 'messageformat-runtime';
import Compiler from './compiler';
import { getAllPlurals, getPlural, hasPlural } from './plurals';
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
   * Returns a subset of `locales` consisting of those for which MessageFormat
   * has built-in plural category support.
   *
   * @memberof MessageFormat
   * @param {(string|string[])} locales
   * @returns {string[]}
   */
  static supportedLocalesOf(locales) {
    const la = Array.isArray(locales) ? locales : [locales];
    return la.filter(hasPlural);
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
   * `cardinals: string[]`, `ordinals: string[]`, `getSource: () => ({ source: string })`.
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
   * Compile a message into a function
   *
   * Given a string `message` with ICU MessageFormat declarations, the result is
   * a function taking a single Object parameter representing each of the
   * input's defined variables, using the first valid locale.
   *
   * @memberof MessageFormat
   * @instance
   * @param {string} message - The input message to be compiled, in ICU MessageFormat
   * @returns {function} - The compiled function
   *
   * @example
   * const mf = new MessageFormat('en')
   * const msg = mf.compile('A {TYPE} example.')
   *
   * msg({ TYPE: 'simple' })  // 'A simple example.'
   */
  compile(message) {
    const compiler = new Compiler(this);
    const plural = this.plurals[0];
    const numFn = this.options.strictNumberSign ? 'strictNumber' : 'number';
    const fn = new Function(
      numFn,
      'plural',
      'select',
      'fmt',
      plural.id,
      'return ' + compiler.compile(message, plural)
    );
    return fn(
      Runtime[numFn],
      Runtime.plural,
      Runtime.select,
      compiler.formatters,
      plural.getCategory
    );
  }

  /**
   * Compile a collection of messages into an ES module
   *
   * With `messages` as a hierarchical structure of ICU MessageFormat strings,
   * the output of `compile()` will be the source code of an ES module with a
   * default export matching the input structure, with each string replaced by
   * its corresponding JS function.
   *
   * If this MessageFormat instance has been initialized with support for more
   * than one locale, using a key that matches the locale's identifier at any
   * depth of a `messages` object will set its child elements to use that locale.
   *
   * @memberof MessageFormat
   * @instance
   * @param {object} messages - The input messages to be compiled
   * @returns {string} - String representation of the compiled module
   *
   * @example
   * import fs from 'fs'
   *
   * const mf = new MessageFormat('en')
   * const msgSet = {
   *   a: 'A {TYPE} example.',
   *   b: 'This has {COUNT, plural, one{one member} other{# members}}.',
   *   c: 'We have {P, number, percent} code coverage.'
   * }
   * const msgModule = mf.compileModule(msgSet)
   * fs.writeFileSync('messages.js', msgModule)
   *
   * ...
   *
   * import messages from './messages'
   *
   * messages.a({ TYPE: 'more complex' })  // 'A more complex example.'
   * messages.b({ COUNT: 3 })              // 'This has 3 members.'
   */
  compileModule(messages) {
    const cp = {};
    if (this.plurals.length > 1)
      for (const pl of this.plurals) cp[pl.lc] = cp[pl.locale] = pl;
    const compiler = new Compiler(this);
    const obj = compiler.compile(messages, this.plurals[0], cp);
    const rtStr = stringifyDependencies(compiler, this.plurals);
    const objStr = stringifyObject(obj);
    return `${rtStr}\nexport default ${objStr}`;
  }
}
