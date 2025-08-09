import type { Expression } from '../data-model/types.ts';
import type { Context } from '../format-context.ts';
import type { MessageFallback } from '../functions/fallback.ts';
import { type MessageString, string } from '../functions/string.ts';
import type { MessageUnknownValue } from '../functions/unknown.ts';
import type { MessageValue } from '../message-value.ts';
import { MessageFunctionContext } from './function-context.ts';
import { resolveFunctionRef } from './resolve-function-ref.ts';
import { resolveVariableRef } from './resolve-variable.ts';

export function resolveExpression<T extends string, P extends string>(
  ctx: Context<T, P>,
  { arg, functionRef }: Expression
):
  | MessageFallback
  | (MessageString & { source: string })
  | MessageUnknownValue
  | (MessageValue<T, P> & { source: string }) {
  if (functionRef) {
    return resolveFunctionRef(ctx, arg, functionRef);
  }
  switch (arg?.type) {
    case 'literal': {
      const source = `|${arg.value}|`;
      const msgCtx = new MessageFunctionContext(ctx, source);
      const msgStr = string(msgCtx, {}, arg.value) as MessageString & {
        source: string;
      };
      msgStr.source = source;
      return msgStr;
    }
    case 'variable':
      return resolveVariableRef(ctx, arg);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported expression: ${arg?.type}`);
  }
}
