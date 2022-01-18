import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { Formattable } from '../formattable';
import type { MessageFormat } from '../messageformat';

import { resolver as functionResolver } from './function';
import { resolver as literal } from './literal';
import { resolver as term } from './term';
import { resolver as variable, Scope } from './variable';

export { isFunction, Function } from './function';
export { isLiteral, Literal } from './literal';
export { isTerm, Term } from './term';
export { isVariable, Variable } from './variable';

export interface PatternElementResolver<T = unknown> {
  type: string;
  resolve(ctx: Context, elem: PatternElement): Formattable;
  initContext?: (mf: Readonly<MessageFormat>, resId: string, scope: Scope) => T;
}

export const patternFormatters = [literal, variable, functionResolver, term];
