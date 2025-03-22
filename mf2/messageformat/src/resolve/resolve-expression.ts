import type { Expression } from '../data-model/types.ts';
import type { Context } from '../format-context.ts';
import type { MessageFallback } from '../functions/fallback.ts';
import type { MessageString } from '../functions/string.ts';
import type { MessageUnknownValue } from '../functions/unknown.ts';
import type { MessageValue } from '../message-value.ts';
import { resolveFunctionRef } from './resolve-function-ref.ts';
import { resolveLiteral } from './resolve-literal.ts';
import { resolveVariableRef } from './resolve-variable.ts';

export function resolveExpression<T extends string, P extends string>(
  ctx: Context<T, P>,
  { arg, functionRef }: Expression
): MessageFallback | MessageString | MessageUnknownValue | MessageValue<T, P> {
  if (functionRef) {
    return resolveFunctionRef(ctx, arg, functionRef);
  }
  switch (arg?.type) {
    case 'literal':
      return resolveLiteral(ctx, arg);
    case 'variable':
      return resolveVariableRef(ctx, arg);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported expression: ${arg?.type}`);
  }
}
