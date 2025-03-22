import type { Literal } from '../data-model/types.ts';
import type { Context } from '../format-context.ts';
import { string } from '../functions/string.ts';
import { MessageFunctionContext } from './function-context.ts';

export function resolveLiteral(ctx: Context, lit: Literal) {
  const msgCtx = new MessageFunctionContext(ctx, `|${lit.value}|`);
  return string(msgCtx, {}, lit.value);
}
