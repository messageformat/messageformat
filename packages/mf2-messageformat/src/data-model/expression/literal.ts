import type { Context } from '../../format-context.js';
import { MessageFunctionContext } from '../../runtime/index.js';

/**
 * An immediately defined value.
 *
 * @remarks
 * Always contains a string value. In Function arguments and options,
 * the expeted type of the value may result in the value being
 * further parsed as a boolean or a number.
 *
 * @beta
 */
export interface Literal {
  type: 'literal';
  value: string;
}

export function resolveLiteral(ctx: Context, lit: Literal) {
  const msgCtx = new MessageFunctionContext(ctx, `|${lit.value}|`);
  return ctx.functions.string(msgCtx, {}, lit.value);
}
