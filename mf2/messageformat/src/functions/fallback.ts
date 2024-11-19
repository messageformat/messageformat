import type { MessageExpressionPart } from '../formatted-parts.js';
import type { MessageValue } from '../message-value.js';

/**
 * Used to represent runtime/formatting errors.
 *
 * @beta
 */
export interface MessageFallback extends MessageValue {
  readonly type: 'fallback';
  readonly source: string;
  readonly locale: 'und';
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
  locale: 'und',
  source,
  toParts: () => [{ type: 'fallback', source }],
  toString: () => `{${source}}`
});
