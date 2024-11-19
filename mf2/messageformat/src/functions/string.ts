import type { MessageExpressionPart } from '../formatted-parts.js';
import type { MessageValue } from '../message-value.js';
import type { MessageFunctionContext } from '../resolve/function-context.js';
import { mergeLocales } from './utils.js';

/** @beta */
export interface MessageString extends MessageValue {
  readonly type: 'string';
  readonly source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
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
  ctx: Pick<MessageFunctionContext, 'dir' | 'locales' | 'source'>,
  options: Record<string, unknown>,
  input?: unknown
): MessageString {
  const str = input === undefined ? '' : String(input);
  const selStr = str.normalize();
  const [locale] = mergeLocales(ctx.locales, input, options);
  return {
    type: 'string',
    source: ctx.source,
    dir: ctx.dir ?? 'auto',
    locale,
    selectKey: keys => (keys.has(selStr) ? selStr : null),
    toParts() {
      const { dir, source } = ctx;
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'string', source, dir, locale, value: str }]
        : [{ type: 'string', source, locale, value: str }];
    },
    toString: () => str,
    valueOf: () => str
  };
}
