import Compiler from './compiler';
import { getAllPlurals, getPlural, hasPlural } from './plurals';

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
   * `cardinals: string[]`, `ordinals: string[]`, `module: string` (to import
   * the formatter as a runtime dependency, rather than inlining its source).
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
   * @param {string} [options.currency='USD'] - The currency to use when
   *   formatting `{V, number, currency}`
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
        currency: 'USD',
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
    const compiler = new Compiler(this.options);
    const fnBody = 'return ' + compiler.compile(message, this.plurals[0]);
    const nfArgs = [];
    const fnArgs = [];
    for (const [key, fmt] of Object.entries(compiler.runtime)) {
      nfArgs.push(key);
      fnArgs.push(fmt);
    }
    const fn = new Function(...nfArgs, fnBody);
    return fn.apply(null, fnArgs);
  }
}
