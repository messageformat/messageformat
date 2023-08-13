import type { Context } from '../format-context';
import type { MessageValue } from '../message-value';

import { FunctionRef, resolveFunctionRef } from './function-ref';
import { Literal, resolveLiteral, Text } from './literal';
import { Reserved, resolveReserved } from './reserved';
import { resolveVariableRef, VariableRef } from './variable-ref';

export { isFunctionRef, FunctionRef, Option } from './function-ref';
export { isLiteral, isText, Literal, Text } from './literal';
export { isReserved, Reserved } from './reserved';
export {
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
  body: Literal | VariableRef | FunctionRef | Reserved;
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
  elem: Expression | FunctionRef | Literal | Reserved | Text | VariableRef
): MessageValue {
  switch (elem.type) {
    case 'literal':
    case 'text':
      return resolveLiteral(elem);
    case 'expression':
      return resolveExpression(ctx, elem.body);
    case 'variable':
      return resolveVariableRef(ctx, elem);
    case 'function':
      return resolveFunctionRef(ctx, elem);
    case 'reserved':
      return resolveReserved(ctx, elem);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported pattern element: ${elem.type}`);
  }
}
