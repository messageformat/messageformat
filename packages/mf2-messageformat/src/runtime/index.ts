/* eslint-disable @typescript-eslint/no-explicit-any */

import { MessageValue } from '../message-value';
import { datetime, number } from './default';

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
  [key: string]: RuntimeFunction<unknown>;
}

/** @beta */
export interface RuntimeFunction<T> {
  call(
    locales: readonly string[],
    options: RuntimeOptions,
    arg?: MessageValue
  ): T;
  options: RuntimeType | Record<string, RuntimeType>;
}

/**
 * Basic type checking is performed on option values.
 *
 * @remarks
 * - `'any'` - Value type is not checked
 * - `'never'` - No value is valid
 * - `'string'`, `'number'`, `'boolean'`, `'object'` - `typeof value` must match
 * - `string[]` - The value must be one of the enumerated string values
 *
 * For literal values, the strings `'true'` and `'false'` are valid for `'boolean'`,
 * and strings representing finite numbers in JavaScript are valid for `'number'`.
 *
 * @beta
 */
export type RuntimeType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'any'
  | 'never'
  | string[];

/**
 * The second argument of runtime function calls is an options bag,
 * with possible keys as defined by the {@link RuntimeFunction} `options`.
 * The `localeMatcher` key is always present.
 *
 * @beta
 */
export interface RuntimeOptions {
  localeMatcher: 'best fit' | 'lookup';
  [key: string]: unknown;
}
