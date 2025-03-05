export type { MessageDateTimePart } from './functions/datetime.ts';
export type { MessageFallbackPart } from './functions/fallback.ts';
export type { MessageNumberPart } from './functions/number.ts';
export type { MessageStringPart } from './functions/string.ts';
export type { MessageUnknownPart } from './functions/unknown.ts';

export interface MessageBiDiIsolationPart {
  type: 'bidiIsolation';
  value: '\u2066' | '\u2067' | '\u2068' | '\u2069'; // LRI | RLI | FSI | PDI
}

export interface MessageExpressionPart {
  type: string;
  source: string;
  dir?: 'ltr' | 'rtl';
  locale?: string;
  id?: string;
  parts?: Array<{ type: string; source?: string; value?: unknown }>;
  value?: unknown;
}

export interface MessageLiteralPart {
  type: 'literal';
  value: string;
}

export interface MessageMarkupPart {
  type: 'markup';
  kind: 'open' | 'standalone' | 'close';
  source: string;
  name: string;
  id?: string;
  options?: { [key: string]: unknown };
}

export type MessagePart =
  | MessageBiDiIsolationPart
  | MessageExpressionPart
  | MessageLiteralPart
  | MessageMarkupPart;
