import { PatternElement } from './data-model';
import type { FormattedPart } from './formatted-part';
import type { Scope } from './pattern/variable';

export interface Context {
  formatAsPart(part: PatternElement): FormattedPart;
  formatAsString(part: PatternElement): string;
  formatAsValue(part: PatternElement): unknown;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  scope: Scope;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stringify(value: any): string;
  [key: string]: unknown;
}
