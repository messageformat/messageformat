import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { FormattedPart } from '../formatted-part';

import { resolveFunction } from './function';
import { resolveLiteral } from './literal';
import { resolveTerm } from './term';
import { resolveVariable } from './variable';

export interface PatternHandler {
  resolve(ctx: Context, part: PatternElement): FormattedPart;
}

export const patternHandlers: Record<string, PatternHandler> = {
  function: { resolve: resolveFunction },
  literal: { resolve: resolveLiteral },
  term: { resolve: resolveTerm },
  variable: { resolve: resolveVariable }
};
