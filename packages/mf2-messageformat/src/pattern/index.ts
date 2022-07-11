import type { Context } from '../format-context';
import type { MessageValue } from '../message-value';

import { Expression, resolveExpression } from './expression';
import { Literal, resolveLiteral } from './literal';
import {
  MarkupEnd,
  MarkupStart,
  resolveMarkupEnd,
  resolveMarkupStart
} from './markup';
import { resolveVariableRef, VariableRef } from './variable-ref';

export { isExpression, Expression, Option } from './expression';
export { isLiteral, Literal } from './literal';
export { isMarkupEnd, isMarkupStart, MarkupEnd, MarkupStart } from './markup';
export { isVariableRef, VariableRef } from './variable-ref';

/**
 * The contents of a message are a sequence of pattern elements, which may be
 * immediately defined literal values, a reference to a value that depends on
 * another message, the value of some runtime variable, or some function
 * defined elsewhere.
 */
export type PatternElement =
  | Expression
  | Literal
  | MarkupEnd
  | MarkupStart
  | VariableRef;

export function resolvePatternElement(
  ctx: Context,
  elem: PatternElement
): MessageValue {
  switch (elem.type) {
    case 'literal':
      return resolveLiteral(elem);
    case 'variable':
      return resolveVariableRef(ctx, elem);
    case 'expression':
      return resolveExpression(ctx, elem);
    case 'markup-start':
      return resolveMarkupStart(ctx, elem);
    case 'markup-end':
      return resolveMarkupEnd(ctx, elem);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported pattern element: ${elem.type}`);
  }
}
