/* eslint-disable @typescript-eslint/no-explicit-any */

import { MessageValue } from '../message-value';
import { datetime, number } from './default';

export { castAsBoolean, castAsInteger } from './cast';

/**
 * The default Runtime includes two functions, `datetime` and `number`.
 *
 * @remarks
 * - `datetime` accepts an optional Date, number or string as its argument
 *   and formats it with the same options as
 *   {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat | Intl.DateTimeFormat}.
 *   If not given any argument, the current date/time is used.
 * - `number` accepts a number, BigInt or string representing a number as its argument
 *   and formats it with the same options as
 *   {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat | Intl.NumberFormat}.
 *   It also supports plural category selection via
 *   {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules | Intl.PluralRules}
 *
 * @beta
 */
export const defaultRuntime = { datetime, number };

/**
 * The runtime function registry available when resolving {@link Expression} elements.
 *
 * @beta
 */
export interface Runtime {
  [key: string]: (
    locales: string[],
    options: RuntimeOptions,
    arg?: MessageValue<any>
  ) => unknown;
}

/**
 * The second argument of runtime function calls is an options bag.
 * The `localeMatcher` key is always present.
 *
 * @beta
 */
export interface RuntimeOptions {
  localeMatcher: 'best fit' | 'lookup';
  [key: string]: unknown;
}
