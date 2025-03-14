import type { MessageValue } from './message-value.ts';
import type { MessageFunction } from './messageformat.ts';

export interface Context {
  functions: Record<string, MessageFunction>;
  onError(error: unknown): void;
  localeMatcher: 'best fit' | 'lookup';
  locales: Intl.Locale[];
  /** Cache for local variables */
  localVars: WeakSet<MessageValue>;
  /**
   * A representation of the parameters/arguments passed to a message formatter,
   * and extended by declarations.
   * Used by the Variable resolver.
   */
  scope: Record<string, unknown>;
}
