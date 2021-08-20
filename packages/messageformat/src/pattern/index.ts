import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { FormattedPart } from '../formatted-part';

import { resolveFunctionPart } from './function';
import { resolveLiteralPart } from './literal';
import { resolveTermPart } from './term';
import { resolveVariablePart } from './variable';

export interface PatternHandler {
  resolve(ctx: Context, part: PatternElement): FormattedPart;
}

export const patternHandlers: Record<string, PatternHandler> = {
  function: { resolve: resolveFunctionPart },
  literal: { resolve: resolveLiteralPart },
  term: { resolve: resolveTermPart },
  variable: { resolve: resolveVariablePart }
};
