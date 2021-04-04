import Compiler from './compiler';
import {
  getAllPlurals,
  getPlural,
  hasPlural,
  PluralFunction,
  PluralObject
} from './plurals';

export { PluralFunction };

/**
 * A compiled message function, which may accept an object parameter
 *
 * @public
 */
export type MessageFunction<ReturnType extends 'string' | 'values'> = (
  param?: Record<string, unknown>
) => ReturnType extends 'string' ? string : unknown[];

export type CustomFormatter = (
  value: unknown,
  locale: string,
  arg: string | null
) => unknown;

/**
 * Options for the MessageFormat constructor
 *
 * @public
 */
export interface MessageFormatOptions<
  ReturnType extends 'string' | 'values' = 'string' | 'values'
> {
  /**
   * Add Unicode control characters to all input parts to preserve the
   * integrity of the output when mixing LTR and RTL text
   *
   * Default: `false`
   */
  biDiSupport?: boolean;

  /**
   * The currency to use when formatting `{V, number, currency}`
   *
   * Default: `USD`
   */
  currency?: string;

  /**
   * Map of custom formatting functions to include. See
   * {@link https://messageformat.github.io/messageformat/custom-formatters/ | Custom Formatters}
   * for more details.
   */
  customFormatters?: {
    [key: string]:
      | CustomFormatter
      | { formatter: CustomFormatter; id: string; module: string };
  };

  /**
   * Require all message arguments to be set with a defined value
   *
   * Default: `false`
   */
  requireAllArguments?: boolean;

  /**
   * Return type of compiled functions; either a concatenated `'string'` or an
   * array (possibly hierarchical) of `'values'`.
   *
   * Default: `'string'`
   */
  returnType?: ReturnType;

  /**
   * Allow `#` only directly within a plural or selectordinal case, rather than
   * in any inner select case as well.
   *
   * Default: `false`
   */
  strictNumberSign?: boolean;
}

/**
 * Returned by {@link MessageFormat.resolvedOptions}
 * @public
 */
export interface ResolvedMessageFormatOptions<
  ReturnType extends 'string' | 'values'
> extends Required<MessageFormatOptions<ReturnType>> {
  /** The default locale */
  locale: string;
  /** All of the supported plurals */
  plurals: PluralObject[];
}

/**
 * The core MessageFormat-to-JavaScript compiler
 *
 * @public
 * @example
 * ```js
 * import MessageFormat from '@messageformat/core'
 * const mf = new MessageFormat('en')
 *
 * const msgSrc = `{GENDER, select,
 *   male {He} female {She} other {They}
 * } found {RES, plural,
 *   =0 {no results} one {1 result} other {# results}
 * }.`;
 * const msg = mf.compile(msgSrc)
 *
 * msg({ GENDER: 'male', RES: 1 })    // 'He found 1 result.'
 * msg({ GENDER: 'female', RES: 1 })  // 'She found 1 result.'
 * msg({ GENDER: 'male', RES: 0 })    // 'He found no results.'
 * msg({ RES: 2 })                    // 'They found 2 results.'
 * ```
 */
export default class MessageFormat<
  ReturnType extends 'string' | 'values' = 'string'
> {
  /**
   * Used by the constructor when no `locale` argument is given.
   * Default: `'en'`
   */
  static defaultLocale = 'en';

  /**
   * Escape characaters that may be considered as MessageFormat markup
   *
   * @remarks
   * This surrounds the characters `{`, `}` and optionally `#` with 'quotes'.
   * This will allow those characters to not be considered as MessageFormat control characters.
   *
   * @param str - The input string
   * @param octothorpe - Also escape `#`
   * @returns The escaped string
   */
  static escape(str: string, octothorpe?: boolean) {
    const esc = octothorpe ? /[#{}]/g : /[{}]/g;
    return String(str).replace(esc, "'$&'");
  }

  /**
   * Returns a subset of `locales` consisting of those for which MessageFormat
   * has built-in plural category support.
   */
  static supportedLocalesOf(locales: string | string[]) {
    const la = Array.isArray(locales) ? locales : [locales];
    return la.filter(hasPlural);
  }

  /** @internal */
  options: Required<MessageFormatOptions<ReturnType>>;

  /** @internal */
  plurals: PluralObject[] = [];

  /**
   * Create a new MessageFormat compiler
   *
   * @remarks
   * If given multiple valid locales, the first will be the default.
   * If `locale` is empty, it will fall back to `MessageFormat.defaultLocale`.
   *
   * String `locale` values will be matched to plural categorisation functions provided by the Unicode CLDR.
   * If defining your own instead, use named functions, optionally providing them with the properties:
   * `cardinals: string[]`, `ordinals: string[]`, and `module: string`
   * (to import the formatter as a runtime dependency, rather than inlining its source).
   *
   * If `locale` has the special value `'*'`, it will match **all** available locales.
   * This may be useful if you want your messages to be completely determined by your data,
   * but may provide surprising results if your input message object includes any 2-3 character keys that are not locale identifiers.
   *
   * @param locale - The locale or locales supported by this MessageFormat instance.
   * @param options - Options for this instance
   */
  constructor(
    locale: string | PluralFunction | Array<string | PluralFunction> | null,
    options?: MessageFormatOptions<ReturnType>
  ) {
    this.options = Object.assign(
      {
        biDiSupport: false,
        currency: 'USD',
        customFormatters: {},
        requireAllArguments: false,
        returnType: 'string',
        strictNumberSign: false
      },
      options
    );
    if (locale === '*') {
      this.plurals = getAllPlurals(MessageFormat.defaultLocale);
    } else if (Array.isArray(locale)) {
      this.plurals = locale.map(getPlural).filter(Boolean) as PluralObject[];
    } else if (locale) {
      const pl = getPlural(locale);
      if (pl) this.plurals = [pl];
    }
    if (this.plurals.length === 0) {
      const pl = getPlural(MessageFormat.defaultLocale) as PluralObject;
      this.plurals = [pl];
    }
  }

  /**
   * Returns a new object with properties reflecting the default locale,
   * plurals, and other options computed during initialization.
   */
  resolvedOptions(): ResolvedMessageFormatOptions<ReturnType> {
    return {
      ...this.options,
      locale: this.plurals[0].locale,
      plurals: this.plurals
    };
  }

  /**
   * Compile a message into a function
   *
   * @remarks
   * Given a string `message` with ICU MessageFormat declarations, the result is
   * a function taking a single Object parameter representing each of the
   * input's defined variables, using the first valid locale.
   *
   * @param message - The input message to be compiled, in ICU MessageFormat
   * @returns The compiled function
   *
   * @example
   * ```js
   * const mf = new MessageFormat('en')
   * const msg = mf.compile('A {TYPE} example.')
   *
   * msg({ TYPE: 'simple' })  // 'A simple example.'
   * ```
   */
  compile(message: string) {
    const compiler = new Compiler(this.options);
    const fnBody = 'return ' + compiler.compile(message, this.plurals[0]);
    const nfArgs = [];
    const fnArgs = [];
    for (const [key, fmt] of Object.entries(compiler.runtime)) {
      nfArgs.push(key);
      fnArgs.push(fmt);
    }
    const fn = new Function(...nfArgs, fnBody);
    return fn(...fnArgs) as MessageFunction<ReturnType>;
  }
}
