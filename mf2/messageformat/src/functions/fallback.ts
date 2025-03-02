import type { MessageExpressionPart } from '../formatted-parts.ts';
import type { MessageValue } from '../message-value.ts';

/**
 * Used to represent runtime/formatting errors.
 *
 * @beta
 */
export interface MessageFallback extends MessageValue {
  readonly type: 'fallback';
  readonly source: string;
  toParts(): [MessageFallbackPart];
  toString(): string;
}

/** @beta */
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
