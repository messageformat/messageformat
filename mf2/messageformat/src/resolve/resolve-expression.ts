import type { Expression } from '../data-model/types.js';
import type { Context } from '../format-context.js';
import type { MessageValue } from '../message-value.js';
import { resolveFunctionRef } from './resolve-function-ref.js';
import { resolveLiteral } from './resolve-literal.js';
import { resolveVariableRef } from './resolve-variable.js';

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
