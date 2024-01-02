import { Context } from '../format-context.js';
import { MessageExpressionPart } from '../formatted-parts.js';
import { datetime } from './datetime.js';
import { fallback } from './fallback.js';
import { integer, number, ordinal, plural } from './number.js';
import { string } from './string.js';
import { unknown } from './unknown.js';

export type { MessageDateTime } from './datetime.js';
export type { MessageFallback } from './fallback.js';
export type { MessageNumber } from './number.js';
export type { MessageString } from './string.js';
export type { MessageUnknownValue } from './unknown.js';

export interface MessageValue {
  readonly type: string;
  readonly locale: string;
  readonly source: string;
  readonly options?: Readonly<object>;
  selectKey?: (keys: Set<string>) => string | null;
  toParts?: () => MessageExpressionPart[];
  toString?: () => string;
  valueOf?: () => unknown;
}

/**
 * The default Runtime includes three functions, `datetime`, `number` and `string`,
 * as well as the `integer`, `ordinal`, and `plural` aliases for `number`.
 *
 * @beta
 */
export const defaultFunctions = Object.freeze({
  datetime,
  integer,
  number,
  ordinal,
  plural,
  string
});

/**
 * Utility functions not available directly as named functions,
 * but used to handle fallback values and input variables of unknown type.
 *
 * @beta
 */
export const utilFunctions = Object.freeze({ fallback, unknown });

export class MessageFunctionContext {
  #ctx: Context;
  readonly source: string;
  constructor(ctx: Context, source: string) {
    this.#ctx = ctx;
    this.source = source;
  }
  get localeMatcher() {
    return this.#ctx.localeMatcher;
  }
  get locales() {
    return this.#ctx.locales.slice();
  }
  get onError() {
    return this.#ctx.onError;
  }
}

/**
 * The runtime function registry available when resolving {@link FunctionAnnotation} elements.
 *
 * @beta
 */
export interface MessageFunctions {
  [key: string]: (
    context: MessageFunctionContext,
    options: Record<string, unknown>,
    input?: unknown
  ) => MessageValue;
}
