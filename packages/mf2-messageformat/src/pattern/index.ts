import type { Context } from '../format-context';
import type { MessageValue } from '../message-value';

import { Expression, resolveExpression } from './expression';
import { Junk, resolveJunk } from './junk';
import { Literal, resolveLiteral, Text } from './literal';
import {
  MarkupEnd,
  MarkupStart,
  resolveMarkupEnd,
  resolveMarkupStart
} from './markup';
import { resolveVariableRef, VariableRef } from './variable-ref';

export { isExpression, Expression, Option } from './expression';
export { isJunk, Junk } from './junk';
export { isLiteral, Literal, Text } from './literal';
export { isMarkupEnd, isMarkupStart, MarkupEnd, MarkupStart } from './markup';
export { isVariableRef, VariableRef } from './variable-ref';

/**
 * Wrapper for non-literal content.
 *
 * @beta
 */
export interface Placeholder {
  type: 'placeholder';
  body: Literal | VariableRef | Expression | MarkupStart | MarkupEnd | Junk;
}

/**
 * Type guard for {@link Placeholder} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPlaceholder = (part: any): part is Placeholder =>
  !!part && typeof part === 'object' && part.type === 'placeholder';

/**
 * The contents of a message are a sequence of pattern elements, which may be
 * immediately defined literal values, a reference to a value that depends on
 * another message, the value of some runtime variable, or some function
 * defined elsewhere.
 *
 * @remarks
 * Depending on the syntax, pattern elements may be wrapped within a Placeholder.
 *
 * @beta
 */
export type PatternElement =
  | Expression
  | Junk
  | Literal
  | MarkupEnd
  | MarkupStart
  | Placeholder
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
    case 'placeholder':
      return resolvePatternElement(ctx, elem.body);
    case 'variable':
      return resolveVariableRef(ctx, elem);
    case 'expression':
      return resolveExpression(ctx, elem);
    case 'markup-start':
      return resolveMarkupStart(ctx, elem);
    case 'markup-end':
      return resolveMarkupEnd(ctx, elem);
    case 'junk':
      return resolveJunk(ctx, elem);
    default:
      // @ts-expect-error - should never happen
      throw new Error(`Unsupported pattern element: ${elem.type}`);
  }
}
