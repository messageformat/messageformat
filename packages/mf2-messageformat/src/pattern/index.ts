import type { Context } from '../format-context';
import type { MessageValue } from '../message-value';

import { FunctionRef, resolveFunctionRef } from './function-ref';
import { Junk, resolveJunk } from './junk';
import { Literal, resolveLiteral, Text } from './literal';
import { resolveVariableRef, VariableRef } from './variable-ref';

export { isFunctionRef, FunctionRef, Option } from './function-ref';
export { isJunk, Junk } from './junk';
export { isLiteral, isText, Literal, Text } from './literal';
export { isVariableRef, VariableRef } from './variable-ref';

/**
 * Wrapper for non-literal content.
 *
 * @beta
 */
export interface Expression {
  type: 'expression';
  body: Literal | VariableRef | FunctionRef | Junk;
}

/**
 * Type guard for {@link Expression} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isExpression = (part: any): part is Expression =>
  !!part && typeof part === 'object' && part.type === 'expression';

/**
 * The contents of a message are a sequence of pattern elements, which may be
 * immediately defined literal values, a reference to a value that depends on
 * another message, the value of some runtime variable, or some function
 * defined elsewhere.
 *
 * @remarks
 * Depending on the syntax, pattern elements may be wrapped within an Expression.
 *
 * @beta
 */
export type PatternElement =
  | FunctionRef
  | Junk
  | Literal
  | Expression
  | Text
  | VariableRef;

/** @internal */
export function resolvePatternElement(
  ctx: Context,
  elem: PatternElement
): MessageValue {
  switch (elem.type) {
    case 'literal':
    case 'nmtoken':
    case 'text':
      return resolveLiteral(elem);
    case 'expression':
      return resolvePatternElement(ctx, elem.body);
    case 'variable':
      return resolveVariableRef(ctx, elem);
    case 'function':
      return resolveFunctionRef(ctx, elem);
    case 'junk':
      return resolveJunk(ctx, elem);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported pattern element: ${elem.type}`);
  }
}
