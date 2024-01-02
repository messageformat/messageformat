import type { Context } from '../format-context';
import type { MessageValue } from '../runtime';

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

export {
  isFunctionAnnotation,
  FunctionAnnotation,
  Option
} from './function-annotation';
export { isLiteral, Literal } from './literal';
export {
  isUnsupportedAnnotation,
  UnsupportedAnnotation
} from './unsupported-annotation';
export {
  getMessageValue,
  isVariableRef,
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

/**
 * Type guard for {@link Expression} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isExpression = (part: any): part is Expression =>
  !!part && typeof part === 'object' && part.type === 'expression';

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
