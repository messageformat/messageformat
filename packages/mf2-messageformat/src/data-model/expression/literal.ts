import type { Context } from '../../format-context.js';
import { MessageFunctionContext } from '../../runtime/index.js';
import type { Literal } from '../types.js';

export function resolveLiteral(ctx: Context, lit: Literal) {
  const msgCtx = new MessageFunctionContext(ctx, `|${lit.value}|`);
  return ctx.functions.string(msgCtx, {}, lit.value);
}
