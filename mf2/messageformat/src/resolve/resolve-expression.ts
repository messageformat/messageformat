import type { Expression } from '../data-model/types.ts';
import type { Context } from '../format-context.ts';
import type { MessageValue } from '../message-value.ts';
import { resolveFunctionRef } from './resolve-function-ref.ts';
import { resolveLiteral } from './resolve-literal.ts';
import { resolveVariableRef } from './resolve-variable.ts';

export function resolveExpression(
  ctx: Context,
  { arg, functionRef }: Expression
): MessageValue {
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
