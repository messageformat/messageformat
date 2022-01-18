import type { PatternElement } from './data-model';
import type { Formattable } from './formattable';

export interface Context {
  resolve(elem: PatternElement): Formattable;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  types: Record<string, unknown>;
}
