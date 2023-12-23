import type { Context } from '../format-context';
import type { MessageValue } from '../runtime';

import { FunctionRef, resolveFunctionRef } from './function-ref';
import { Literal, resolveLiteral } from './literal';
import {
  resolveunsupportedAnnotation,
  UnsupportedAnnotation
} from './unsupported-annotation';
import { resolveVariableRef, VariableRef } from './variable-ref';

export { isFunctionRef, FunctionRef, Option } from './function-ref';
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
export interface Expression {
  type: 'expression';
  body: Literal | VariableRef | FunctionRef | UnsupportedAnnotation;
}

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
      return resolveFunctionRef(ctx, body);
    case 'unsupported-annotation':
      return resolveunsupportedAnnotation(ctx, body);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported expression: ${body.type}`);
  }
}
