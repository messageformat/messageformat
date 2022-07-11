import type { Context } from '../format-context';
import type { MessageValue } from '../message-value';
import type { MessageFormat } from '../messageformat';

import { Expression, expressionResolver } from './expression';
import { Literal, literalResolver } from './literal';
import {
  MarkupEnd,
  markupEndResolver,
  MarkupStart,
  markupStartResolver
} from './markup';
import { Scope, VariableRef, variableRefResolver } from './variable-ref';

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

export interface PatternElementResolver<T = unknown> {
  type: string;
  resolve(ctx: Context, elem: PatternElement): MessageValue;
  initContext?: (mf: Readonly<MessageFormat>, scope: Scope) => T;
}

export const patternFormatters = [
  literalResolver,
  variableRefResolver,
  expressionResolver,
  markupStartResolver,
  markupEndResolver
];
