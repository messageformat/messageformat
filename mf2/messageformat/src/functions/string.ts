import type { MessageExpressionPart } from '../formatted-parts.ts';
import type { MessageValue } from '../message-value.ts';
import type { MessageFunctionContext } from '../resolve/function-context.ts';

export interface MessageString extends MessageValue {
  readonly type: 'string';
  readonly source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
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

/**
 * Accepts any input, and parses any non-string value using `String()`.
 * For no input, resolves its value to an empty string.
 * On error, resolves to a fallback value.
 */
export function string(
  ctx: Pick<MessageFunctionContext, 'dir' | 'locales' | 'source'>,
  _options: Record<string, unknown>,
  input?: unknown
): MessageString {
  const str = input === undefined ? '' : String(input);
  const selStr = str.normalize();
  return {
    type: 'string',
    source: ctx.source,
    dir: ctx.dir ?? 'auto',
    selectKey: keys => (keys.has(selStr) ? selStr : null),
    toParts() {
      const { dir, source } = ctx;
      const locale = ctx.locales[0];
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'string', source, dir, locale, value: str }]
        : [{ type: 'string', source, locale, value: str }];
    },
    toString: () => str,
    valueOf: () => str
  };
}
