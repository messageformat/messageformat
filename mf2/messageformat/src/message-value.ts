import type { MessageExpressionPart } from './formatted-parts.js';

export const BIDI_ISOLATE = Symbol('bidi-isolate');

export interface MessageValue {
  readonly type: string;
  readonly source: string;
  readonly locale: string;
  readonly dir?: 'ltr' | 'rtl' | 'auto';
  readonly options?: Readonly<object>;
  selectKey?: (keys: Set<string>) => string | null;
  toParts?: () => MessageExpressionPart[];
  toString?: () => string;
  valueOf?: () => unknown;
  [BIDI_ISOLATE]?: boolean;
}
