import type { MessageExpressionPart } from './formatted-parts.ts';

export const BIDI_ISOLATE = Symbol('bidi-isolate');

/**
 * The base for all resolved message values.
 *
 * @typeParam T - The uniquely identifying `type` of the message value.
 * @typeParam P - The `"type"` used in the formatted-parts representation of the message value.
 */
export interface MessageValue<T extends string, P extends string = T> {
  readonly type: T;
  readonly dir?: 'ltr' | 'rtl' | 'auto';
  readonly options?: Readonly<object>;
  selectKey?: (keys: Set<string>) => string | null;
  toParts?: () => MessageExpressionPart<P>[];
  toString?: () => string;
  valueOf?: () => unknown;
  /** @private */
  [BIDI_ISOLATE]?: boolean;
}
