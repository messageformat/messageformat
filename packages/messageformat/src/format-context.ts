import { PatternElement } from './data-model';
import type { MessageFormatPart } from './formatted-part';

export interface Context {
  formatAsParts(part: PatternElement): MessageFormatPart[];
  formatAsString(part: PatternElement): string;
  formatAsValue(part: PatternElement): unknown;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stringify(value: any): string;
  types: Record<string, unknown>;
}
