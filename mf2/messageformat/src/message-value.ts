import type { MessageExpressionPart } from './formatted-parts.ts';

export const BIDI_ISOLATE = Symbol('bidi-isolate');

/**
 * The base for all resolved message values.
 */
export interface MessageValue<T extends string, P extends string = T> {
  readonly type: T;
  readonly source: string;
  readonly dir?: 'ltr' | 'rtl' | 'auto';
  readonly options?: Readonly<object>;
  selectKey?: (keys: Set<string>) => string | null;
  toParts?: () => MessageExpressionPart<P>[];
  toString?: () => string;
  valueOf?: () => unknown;
  /** @private */
  [BIDI_ISOLATE]?: boolean;
}
