import { Context } from '../format-context.js';
import { datetime } from './datetime.js';
import { number } from './number.js';
import { string } from './string.js';

export { MessageDateTime, MessageDateTimePart, datetime } from './datetime.js';
export { MessageFallback, MessageFallbackPart, fallback } from './fallback.js';
export { MessageNumber, MessageNumberPart, number } from './number.js';
export { MessageString, MessageStringPart, string } from './string.js';
export { MessageUnknownPart, MessageUnknownValue, unknown } from './unknown.js';
export {
  asBoolean,
  asPositiveInteger,
  asString,
  mergeLocales
} from './utils.js';

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

export interface MessageExpressionPart {
  type: string;
  source: string;
  locale?: string;
  parts?: Array<{ type: string; source?: string; value?: unknown }>;
  value?: unknown;
}

export interface MessageLiteralPart {
  type: 'literal';
  value: string;
}

export interface MessageMarkupPart {
  type: 'markup';
  kind: 'open' | 'standalone';
  source: string;
  name: string;
  options?: { [key: string]: unknown };
}

export interface MessageMarkupClosePart {
  type: 'markup';
  kind: 'close';
  source: string;
  name: string;
  options?: never;
}

export type MessagePart =
  | MessageExpressionPart
  | MessageLiteralPart
  | MessageMarkupClosePart
  | MessageMarkupPart;

/**
 * The default Runtime includes three functions, `datetime`, `number` and `string`.
 *
 * @beta
 */
export const defaultFunctions = { datetime, number, string };

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
