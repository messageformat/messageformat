import type { Literal } from '../data-model/types.ts';
import type { Context } from '../format-context.ts';
import { MessageString, string } from '../functions/string.ts';
import { MessageFunctionContext } from './function-context.ts';

export function resolveLiteral(
  ctx: Context,
  lit: Literal
): MessageString & { source: string } {
  const source = `|${lit.value}|`;
  const msgCtx = new MessageFunctionContext(ctx, source);
  const msgStr = string(msgCtx, {}, lit.value);
  return Object.assign(msgStr, { source });
}
