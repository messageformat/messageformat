import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { FormattedPart } from '../formatted-part';
import type { MessageFormat } from '../messageformat';

import { formatter as functionFormatter } from './function';
import { formatter as literal } from './literal';
import { formatter as term } from './term';
import { formatter as variable } from './variable';

export interface PatternFormatter {
  formatAsPart(ctx: Context, part: PatternElement): FormattedPart;
  formatAsString(ctx: Context, part: PatternElement): string;
  formatAsValue(ctx: Context, part: PatternElement): unknown;
  initContext?: (mf: Readonly<MessageFormat>, resId: string) => unknown;
}

export const patternFormatters: Record<string, PatternFormatter> = {
  function: functionFormatter,
  literal,
  term,
  variable
};
