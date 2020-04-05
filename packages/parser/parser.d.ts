/**
 * An AST parser for ICU MessageFormat strings – part of
 * [messageformat](https://messageformat.github.io/).
 *
 * @remarks
 * The parser only supports the default `DOUBLE_OPTIONAL`
 * [apostrophe mode](http://www.icu-project.org/apiref/icu4c/messagepattern_8h.html#af6e0757e0eb81c980b01ee5d68a9978b).
 *
 * @param src The string to be parsed
 * @param options Optional configuration options
 */
export function parse(src: string, options?: ParseOptions): Token[];

export interface ParseOptions {
  /**
   * Array of valid plural categories for the current locale, used to validate
   * `plural` keys. If undefined or false, the full set of valid
   * [Unicode CLDR](http://cldr.unicode.org/index/cldr-spec/plural-rules) keys
   * is used: `'zero', 'one', 'two', 'few', 'many', 'other'`. To disable this
   * check, pass in an empty array.
   */
  cardinal?: PluralCategory[] | false;
  /**
   * Array of valid plural categories for the current locale, used to validate
   * `selectordinal` keys. If undefined or false, the full set of valid
   * [Unicode CLDR](http://cldr.unicode.org/index/cldr-spec/plural-rules) keys
   * is used: `'zero', 'one', 'two', 'few', 'many', 'other'`. To disable this
   * check, pass in an empty array.
   */
  ordinal?: PluralCategory[] | false;
  /**
   * By default, the parsing applies a few relaxations to the ICU MessageFormat
   * spec. Setting `strict: true` will disable these relaxations:
   *   - The `argType` of `simpleArg` formatting functions will be restricted to the
   *     set of `number`, `date`, `time`, `spellout`, `ordinal`, and `duration`,
   *     rather than accepting any lower-case identifier that does not start with a
   *     number.
   *   - The optional `argStyle` of `simpleArg` formatting functions will not be
   *     parsed as any other text, but instead as the spec requires: "In
   *     argStyleText, every single ASCII apostrophe begins and ends quoted literal
   *     text, and unquoted {curly braces} must occur in matched pairs."
   *   - Inside a `plural` or `selectordinal` statement, a pound symbol (`#`) is
   *     replaced with the input number. By default, `#` is also parsed as a special
   *     character in nested statements too, and can be escaped using apostrophes
   *     (`'#'`). In strict mode `#` will be parsed as a special character only
   *     directly inside a `plural` or `selectordinal` statement. Outside those, `#`
   *     and `'#'` will be parsed as literal text.
   */
  strict?: boolean;
}

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export type Token = string | SimpleArg | FunctionArg | Plural | Select;

export interface SimpleArg {
  type: 'argument';
  arg: string;
}

export interface FunctionArg {
  type: 'function';
  arg: string;
  key: string;
  param: { tokens: (Token | Octothorpe)[] } | undefined;
}

export interface Plural {
  type: 'plural' | 'selectordinal';
  arg: string;
  offset: number;
  cases: PluralCase[];
}

export interface Select {
  type: 'select';
  arg: string;
  cases: SelectCase[];
}

export interface PluralCase {
  /** A valid plural category, or a string matching `^=\d+$` */
  key: string;
  tokens: (Token | Octothorpe)[];
}

export interface SelectCase {
  key: string;
  tokens: (Token | Octothorpe)[];
}

export interface Octothorpe {
  type: 'octothorpe';
}
