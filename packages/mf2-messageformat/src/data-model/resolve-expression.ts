import type { Context } from '../format-context.js';
import type { MessageValue } from '../functions/index.js';
import { resolveFunctionAnnotation } from './resolve-function-annotation.js';
import { resolveLiteral } from './resolve-literal.js';
import { resolveUnsupportedAnnotation } from './resolve-unsupported-annotation.js';
import { resolveVariableRef } from './resolve-variable.js';
import type { Expression } from './types.js';

export function resolveExpression(
  ctx: Context,
  { arg, annotation }: Expression
): MessageValue {
  if (annotation) {
    return annotation.type === 'function'
      ? resolveFunctionAnnotation(ctx, arg, annotation)
      : resolveUnsupportedAnnotation(ctx, arg, annotation);
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
