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

export type { MessageValue } from '../message-value.ts';
export type { MessageFunctionContext } from '../resolve/function-context.ts';
export type { MessageDateTime } from './datetime.ts';
export type { MessageFallback } from './fallback.ts';
export type { MessageNumber } from './number.ts';
export type { MessageString } from './string.ts';

import { currency } from './currency.ts';
import { date, datetime, time } from './datetime.ts';
import { math } from './math.ts';
import { integer, number } from './number.ts';
import { string } from './string.ts';
import { unit } from './unit.ts';

/**
 * Functions classified as REQUIRED by the MessageFormat 2 specification.
 */
export const DefaultFunctions = Object.freeze({
  integer,
  number,
  string
});

/**
 * Functions classified as DRAFT by the MessageFormat 2 specification.
 *
 * These are liable to change, and are not covered by any stability guarantee.
 *
 * @alpha
 */
export const DraftFunctions = Object.freeze({
  currency,
  date,
  datetime,
  math,
  time,
  unit
});
