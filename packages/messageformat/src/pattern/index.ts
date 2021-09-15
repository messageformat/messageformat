import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { Formattable } from '../formattable';
import type { MessageFormatPart } from '../formatted-part';
import type { MessageFormat } from '../messageformat';

import { formatter as functionFormatter } from './function';
import { formatter as literal } from './literal';
import { formatter as term } from './term';
import { formatter as variable, Scope } from './variable';

export { isFunction, Function } from './function';
export { isLiteral, Literal } from './literal';
export { isTerm, Term } from './term';
export { getArgSource } from './util-arg-source';
export { isVariable, Variable } from './variable';

export interface PatternFormatter<T = unknown> {
  type: string;
  asFormattable(ctx: Context, part: PatternElement): Formattable;
  formatToParts(ctx: Context, part: PatternElement): MessageFormatPart[];
  formatToString(ctx: Context, part: PatternElement): string;
  initContext?: (mf: Readonly<MessageFormat>, resId: string, scope: Scope) => T;
}

export const patternFormatters = [literal, variable, functionFormatter, term];
