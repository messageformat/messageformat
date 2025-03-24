import type { MessageValue } from './message-value.ts';
import type { MessageFunction } from './messageformat.ts';

export interface Context<T extends string = string, P extends string = T> {
  functions: Record<string, MessageFunction<T, P>>;
  onError(error: unknown): void;
  localeMatcher: 'best fit' | 'lookup';
  locales: Intl.Locale[];
  /** Cache for local variables */
  localVars: WeakSet<MessageValue<T, P>>;
  /**
   * A representation of the parameters/arguments passed to a message formatter,
   * and extended by declarations.
   * Used by the Variable resolver.
   */
  scope: Record<string, unknown>;
}
