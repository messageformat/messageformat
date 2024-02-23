export type { MessageDateTimePart } from './functions/datetime.js';
export type { MessageFallbackPart } from './functions/fallback.js';
export type { MessageNumberPart } from './functions/number.js';
export type { MessageStringPart } from './functions/string.js';
export type { MessageUnknownPart } from './functions/unknown.js';

/** @beta */
export interface MessageExpressionPart {
  type: string;
  source: string;
  locale?: string;
  parts?: Array<{ type: string; source?: string; value?: unknown }>;
  value?: unknown;
}

/** @beta */
export interface MessageLiteralPart {
  type: 'literal';
  value: string;
}

/** @beta */
export interface MessageMarkupPart {
  type: 'markup';
  kind: 'open' | 'standalone' | 'close';
  source: string;
  name: string;
  options?: { [key: string]: unknown };
}

/** @beta */
export type MessagePart =
  | MessageExpressionPart
  | MessageLiteralPart
  | MessageMarkupPart;
