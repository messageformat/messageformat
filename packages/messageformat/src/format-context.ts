import type { PatternElement } from './data-model';
import type { PatternFormatter } from './pattern';

export interface Context {
  getFormatter(part: PatternElement): PatternFormatter;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  types: Record<string, unknown>;
}
