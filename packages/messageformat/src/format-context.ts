import type { PatternElement } from './data-model';
import type { MessageValue } from './message-value';

export interface Context {
  resolve(elem: PatternElement): MessageValue;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  types: Record<string, unknown>;
}
