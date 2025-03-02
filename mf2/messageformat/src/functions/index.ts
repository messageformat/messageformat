/**
 * `messageformat/functions`
 *
 * Implementations for :number, :string, and other default functions,
 * along with some utilities for building custom function handlers.
 */

export { getLocaleDir } from '../dir-utils.js';
export { asBoolean, asPositiveInteger, asString } from './utils.js';

export type { MessageValue } from '../message-value.js';
export type { MessageFunctionContext } from '../resolve/function-context.js';
export type { MessageDateTime } from './datetime.js';
export type { MessageFallback } from './fallback.js';
export type { MessageNumber } from './number.js';
export type { MessageString } from './string.js';

import { currency } from './currency.js';
import { date, datetime, time } from './datetime.js';
import { math } from './math.js';
import { integer, number } from './number.js';
import { string } from './string.js';
import { unit } from './unit.js';

/**
 * Functions classified as REQUIRED by the MessageFormat 2 specification.
 *
 * @beta
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
