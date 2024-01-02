import type { MessageFunctionContext, MessageValue } from './index.js';
import type { MessageExpressionPart } from '../formatted-parts.js';
import { mergeLocales } from './utils.js';

export interface MessageString extends MessageValue {
  readonly type: 'string';
  readonly source: string;
  readonly locale: string;
  selectKey(keys: Set<string>): string | null;
  toParts(): [MessageStringPart];
  toString(): string;
  valueOf(): string;
}

export interface MessageStringPart extends MessageExpressionPart {
  type: 'string';
  source: string;
  locale: string;
  value: string;
}

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
