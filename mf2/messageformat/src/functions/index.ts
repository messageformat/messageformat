/**
 * Implementations for :number, :string, and other default functions,
 * along with some utilities for building custom function handlers.
 *
 * ```js
 * import { MessageFormat } from 'messageformat';
 * import { DraftFunctions } from 'messageformat/functions';
 *
 * const mf = new MessageFormat(locale, msgSrc, { functions: DraftFunctions });
 * ```
 *
 * @module
 */

export { getLocaleDir } from '../dir-utils.ts';
export { asBoolean, asPositiveInteger, asString } from './utils.ts';

export type { MessageFunction } from '../messageformat.ts';
export type { MessageValue } from '../message-value.ts';
export type { MessageFunctionContext } from '../resolve/function-context.ts';
export type { MessageDateTime } from './datetime.ts';
export type { MessageFallback } from './fallback.ts';
export type { MessageNumber } from './number.ts';
export type { MessageString } from './string.ts';

import { currency } from './currency.ts';
import { date, datetime, time } from './datetime.ts';
import { integer, number } from './number.ts';
import { offset } from './offset.ts';
import { percent } from './percent.ts';
import { string } from './string.ts';
import { unit } from './unit.ts';

/**
 * Functions classified as REQUIRED by the
 * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#contents-of-part-9-messageformat | LDML 48 MessageFormat specification}.
 */
export let DefaultFunctions = {
  /**
   * Supports formatting and selection as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-integer-function | :integer function}.
   *
   * The `operand` must be a number, BigInt, or string representing a JSON number,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   */
  integer,

  /**
   * Supports formatting and selection as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-number-function | :number function}.
   *
   * The `operand` must be a number, BigInt, or string representing a JSON number,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   */
  number,

  /**
   * Supports formatting and selection as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-offset-function | :offset function}.
   *
   * The `operand` must be a number, BigInt, or string representing a JSON number,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   */
  offset,

  /**
   * Supports formatting and selection as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-string-function | :string function}.
   *
   * The `operand` must be a stringifiable value.
   * An `undefined` value is resolved as an empty string.
   */
  string
};
DefaultFunctions = Object.freeze(
  Object.assign(Object.create(null), DefaultFunctions)
);

/**
 * Functions classified as DRAFT by the
 * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#contents-of-part-9-messageformat | LDML 48 MessageFormat specification}.
 *
 * These are liable to change, and are **_not_** covered by any stability guarantee.
 *
 * ```js
 * import { MessageFormat } from 'messageformat';
 * import { DraftFunctions } from 'messageformat/functions';
 *
 * const mf = new MessageFormat(locale, msgsrc, { functions: DraftFunctions });
 * ```
 *
 * @beta
 */
export let DraftFunctions = {
  /**
   * Supports formatting as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-currency-function | :currency function}.
   *
   * The `operand` must be a number, BigInt, or string representing a JSON number,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   *
   * The `currency` option must be provided by either the operand's `options` or the `exprOpt` expression options.
   */
  currency,

  /**
   * Supports formatting as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-date-function | :date function}.
   *
   * The `operand` must be a Date, number, or string representing a date,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   */
  date,

  /**
   * Supports formatting as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-datetime-function | :datetime function}.
   *
   * The `operand` must be a Date, number, or string representing a date,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   */
  datetime,

  /**
   * Supports formatting as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-percent-function | :percent function}.
   *
   * The `operand` must be a number, BigInt, or string representing a JSON number,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   */
  percent,

  /**
   * Supports formatting as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-time-function | :time function}.
   *
   * The `operand` must be a Date, number, or string representing a date,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   */
  time,

  /**
   * Supports formatting as defined in LDML 48 for the
   * {@link https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#the-unit-function | :unit function}.
   *
   * The `operand` must be a number, BigInt, or string representing a JSON number,
   * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
   *
   * The `unit` option must be provided by either the operand's `options` or the `exprOpt` expression options.
   */
  unit
};
DraftFunctions = Object.freeze(
  Object.assign(Object.create(null), DraftFunctions)
);
