import type { PatternElement } from './data-model';
import type { Formattable } from './formattable';
import type { MessageFormatPart } from './formatted-part';

export interface Context {
  asFormattable(part: PatternElement): Formattable;
  formatToParts(part: PatternElement): MessageFormatPart[];
  formatToString(part: PatternElement): string;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  types: Record<string, unknown>;
}
