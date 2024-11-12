import type { Context } from '../format-context.js';
import { MessageFunctionContext } from './function-context.js';
import type { Literal } from '../data-model/types.js';

export function resolveLiteral(ctx: Context, lit: Literal) {
  const msgCtx = new MessageFunctionContext(ctx, `|${lit.value}|`);
  return ctx.functions.string(msgCtx, {}, lit.value);
}
