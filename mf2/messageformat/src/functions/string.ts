import type { MessageExpressionPart } from '../formatted-parts.ts';
import type { MessageValue } from '../message-value.ts';
import type { MessageFunctionContext } from '../resolve/function-context.ts';

/**
 * The resolved value of a {@link DefaultFunctions.string | :string} expression,
 * or of an expression with a literal operand and no function.
 */
export interface MessageString extends MessageValue<'string'> {
  readonly type: 'string';
  readonly source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
  selectKey(keys: Set<string>): string | null;
  toParts(): [MessageStringPart];
  toString(): string;
  valueOf(): string;
}

/**
 * The formatted part for a {@link MessageString} value.
 *
 * @category Formatted Parts
 */
export interface MessageStringPart extends MessageExpressionPart<'string'> {
  type: 'string';
  source: string;
  locale: string;
  value: string;
}

export function string(
  ctx: Pick<MessageFunctionContext, 'dir' | 'locales' | 'source'>,
  _options: Record<string, unknown>,
  operand?: unknown
): MessageString {
  const str = operand === undefined ? '' : String(operand);
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
