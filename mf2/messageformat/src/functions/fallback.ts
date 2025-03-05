import type { MessageExpressionPart } from '../formatted-parts.ts';
import type { MessageValue } from '../message-value.ts';

/**
 * Used to represent runtime/formatting errors.
 */
export interface MessageFallback extends MessageValue {
  readonly type: 'fallback';
  readonly source: string;
  toParts(): [MessageFallbackPart];
  toString(): string;
}

export interface MessageFallbackPart extends MessageExpressionPart {
  type: 'fallback';
  source: string;
}

export const fallback = (source: string = '�'): MessageFallback => ({
  type: 'fallback',
  source,
  toParts: () => [{ type: 'fallback', source }],
  toString: () => `{${source}}`
});
