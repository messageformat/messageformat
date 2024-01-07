import type { MessageExpressionPart } from '../formatted-parts.js';
import type { MessageFunctionContext, MessageValue } from './index.js';
import { mergeLocales } from './utils.js';

/** @beta */
export interface MessageString extends MessageValue {
  readonly type: 'string';
  readonly source: string;
  readonly locale: string;
  selectKey(keys: Set<string>): string | null;
  toParts(): [MessageStringPart];
  toString(): string;
  valueOf(): string;
}

/** @beta */
export interface MessageStringPart extends MessageExpressionPart {
  type: 'string';
  source: string;
  locale: string;
  value: string;
}

/**
 * Accepts any input, and parses any non-string value using `String()`.
 * For no input, resolves its value to an empty string.
 * On error, resolves to a fallback value.
 *
 * @beta */
export function string(
  { locales, source }: Pick<MessageFunctionContext, 'locales' | 'source'>,
  options: Record<string, unknown>,
  input?: unknown
): MessageString {
  const str = input === undefined ? '' : String(input);
  const [locale] = mergeLocales(locales, input, options);
  return {
    type: 'string',
    source,
    locale,
    selectKey: keys => (keys.has(str) ? str : null),
    toParts: () => [{ type: 'string', source, locale, value: str }],
    toString: () => str,
    valueOf: () => str
  };
}
