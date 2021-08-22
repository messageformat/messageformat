import { PatternElement } from './data-model';
import type { MessageFormatPart } from './formatted-part';

export interface Context {
  formatToParts(part: PatternElement): MessageFormatPart[];
  formatToString(part: PatternElement): string;
  formatToValue(part: PatternElement, formattable?: Function): unknown;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  types: Record<string, unknown>;
}
