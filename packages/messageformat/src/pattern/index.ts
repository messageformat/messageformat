import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { MessageValue } from '../message-value';
import type { MessageFormat } from '../messageformat';

import { resolver as functionResolver } from './function-ref';
import { resolver as literal } from './literal';
import { resolver as term } from './message-ref';
import { resolver as variable, Scope } from './variable-ref';

export { isFunctionRef, FunctionRef } from './function-ref';
export { isLiteral, Literal } from './literal';
export { isMessageRef, MessageRef } from './message-ref';
export { isVariableRef, VariableRef } from './variable-ref';

export interface PatternElementResolver<T = unknown> {
  type: string;
  resolve(ctx: Context, elem: PatternElement): MessageValue;
  initContext?: (mf: Readonly<MessageFormat>, resId: string, scope: Scope) => T;
}

export const patternFormatters = [literal, variable, functionResolver, term];
