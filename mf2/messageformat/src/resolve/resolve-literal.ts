import type { Context } from '../format-context.ts';
import { MessageFunctionContext } from './function-context.ts';
import type { Literal } from '../data-model/types.ts';

export function resolveLiteral(ctx: Context, lit: Literal) {
  const msgCtx = new MessageFunctionContext(ctx, `|${lit.value}|`);
  return ctx.functions.string(msgCtx, {}, lit.value);
}
