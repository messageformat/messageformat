import type { Context } from '../../format-context';
import type { MessageValue } from '../../runtime';

import {
  FunctionAnnotation,
  resolveFunctionAnnotation
} from './function-annotation';
import { Literal, resolveLiteral } from './literal';
import {
  UnsupportedAnnotation,
  resolveUnsupportedAnnotation
} from './unsupported-annotation';
import { VariableRef, resolveVariableRef } from './variable-ref';

export type { FunctionAnnotation, Option } from './function-annotation';
export type { Literal } from './literal';
export type { UnsupportedAnnotation } from './unsupported-annotation';
export {
  getMessageValue,
  UnresolvedExpression,
  VariableRef
} from './variable-ref';

/**
 * Wrapper for selectors and placeholders.
 *
 * @beta
 */
export type Expression<
  A extends Literal | VariableRef | undefined =
    | Literal
    | VariableRef
    | undefined
> = A extends Literal | VariableRef
  ? {
      type: 'expression';
      arg: A;
      annotation?: FunctionAnnotation | UnsupportedAnnotation;
    }
  : {
      type: 'expression';
      arg?: never;
      annotation: FunctionAnnotation | UnsupportedAnnotation;
    };

/** @internal */
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
