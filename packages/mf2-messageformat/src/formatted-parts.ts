export type { MessageDateTimePart } from './functions/datetime.js';
export type { MessageFallbackPart } from './functions/fallback.js';
export type { MessageNumberPart } from './functions/number.js';
export type { MessageStringPart } from './functions/string.js';
export type { MessageUnknownPart } from './functions/unknown.js';

export interface MessageExpressionPart {
  type: string;
  source: string;
  locale?: string;
  parts?: Array<{ type: string; source?: string; value?: unknown }>;
  value?: unknown;
}

export interface MessageLiteralPart {
  type: 'literal';
  value: string;
}

export interface MessageMarkupPart {
  type: 'markup';
  kind: 'open' | 'standalone';
  source: string;
  name: string;
  options?: { [key: string]: unknown };
}

export interface MessageMarkupClosePart {
  type: 'markup';
  kind: 'close';
  source: string;
  name: string;
  options?: never;
}

export type MessagePart =
  | MessageExpressionPart
  | MessageLiteralPart
  | MessageMarkupClosePart
  | MessageMarkupPart;
