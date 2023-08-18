import { datetime } from './datetime.js';
import { number } from './number.js';
import { string } from './string.js';

export { MessageDateTime, MessageDateTimePart, datetime } from './datetime.js';
export { MessageFallback, MessageFallbackPart, fallback } from './fallback.js';
export { MessageMarkup, MessageMarkupPart, markup } from './markup.js';
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
  parts?: Array<{ type: string; value: unknown }>;
  value?: unknown;
}

export interface MessageLiteralPart {
  type: 'literal';
  value: string;
}

export type MessagePart = MessageExpressionPart | MessageLiteralPart;

/**
 * The default Runtime includes three functions, `datetime`, `number` and `string`.
 *
 * @beta
 */
export const defaultRuntime = { datetime, number, string };

/**
 * The runtime function registry available when resolving {@link FunctionRef} elements.
 *
 * @beta
 */
export interface Runtime {
  [key: string]: (
    source: string,
    locales: string[],
    options: RuntimeOptions,
    input?: unknown
  ) => MessageValue;
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
