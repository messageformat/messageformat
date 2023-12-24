import type { Context } from '../format-context';
import type { MessageValue } from '../runtime';

import {
  resolveFunctionAnnotation,
  FunctionAnnotation
} from './function-annotation';
import { Literal, resolveLiteral } from './literal';
import {
  resolveunsupportedAnnotation,
  UnsupportedAnnotation
} from './unsupported-annotation';
import { resolveVariableRef, VariableRef } from './variable-ref';

export {
  functionAnnotationSource,
  isFunctionAnnotation,
  FunctionAnnotation,
  Option
} from './function-annotation';
export { isLiteral, Literal } from './literal';
export {
  isUnsupportedAnnotation,
  UnsupportedAnnotation
} from './unsupported-annotation';
export { resolveValue } from './value.js';
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
export type Expression = {
  type: 'expression';
  body: Literal | VariableRef | FunctionAnnotation | UnsupportedAnnotation;
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
  { body }: Expression
): MessageValue {
  switch (body.type) {
    case 'literal':
      return resolveLiteral(ctx, body);
    case 'variable':
      return resolveVariableRef(ctx, body);
    case 'function':
      return resolveFunctionAnnotation(ctx, body);
    case 'unsupported-annotation':
      return resolveunsupportedAnnotation(ctx, body);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported expression: ${body.type}`);
  }
}
