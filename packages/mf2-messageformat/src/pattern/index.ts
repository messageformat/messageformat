import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { MessageValue } from '../message-value';
import type { MessageFormat } from '../messageformat';

import { resolver as element } from './element';
import { resolver as functionResolver } from './expression';
import { resolver as literal } from './literal';
import { resolver as variable, Scope } from './variable-ref';

export { isElement, Element } from './element';
export { isExpression, Expression } from './expression';
export { isLiteral, Literal } from './literal';
export { isVariableRef, VariableRef } from './variable-ref';

export interface PatternElementResolver<T = unknown> {
  type: string;
  resolve(ctx: Context, elem: PatternElement): MessageValue;
  initContext?: (mf: Readonly<MessageFormat>, scope: Scope) => T;
}

export const patternFormatters = [literal, variable, functionResolver, element];
