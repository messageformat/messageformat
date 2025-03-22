import type { MessageExpressionPart } from '../formatted-parts.ts';
import type { MessageValue } from '../message-value.ts';

/**
 * Used to represent runtime/formatting errors.
 */
export interface MessageFallback extends MessageValue<'fallback'> {
  readonly type: 'fallback';
  readonly source: string;
  toParts(): [MessageFallbackPart];
  toString(): string;
}

/** @category Formatted Parts */
export interface MessageFallbackPart extends MessageExpressionPart<'fallback'> {
  type: 'fallback';
  source: string;
}

export const fallback = (source: string = '�'): MessageFallback => ({
  type: 'fallback',
  source,
  toParts: () => [{ type: 'fallback', source }],
  toString: () => `{${source}}`
});
