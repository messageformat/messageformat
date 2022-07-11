import type { MessageValue } from './message-value';
import type { PatternElement } from './pattern';

export interface Context {
  onError(error: unknown, value: MessageValue): void;
  resolve(elem: PatternElement): MessageValue;
  localeMatcher: 'best fit' | 'lookup';
  locales: string[];
  types: Record<string, unknown>;
}
