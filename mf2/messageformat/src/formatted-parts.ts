export type { MessageDateTimePart } from './functions/datetime.ts';
export type { MessageFallbackPart } from './functions/fallback.ts';
export type { MessageNumberPart } from './functions/number.ts';
export type { MessageStringPart } from './functions/string.ts';
export type { MessageUnknownPart } from './functions/unknown.ts';

/**
 * These are always paired in the output.
 * The first part has U+2066 LEFT-TO-RIGHT ISOLATE, U+2067 RIGHT-TO-LEFT ISOLATE,
 * or U+2068 FIRST STRONG ISOLATE as its `value`,
 * and an ending isolation part has U+2069 POP DIRECTIONAL ISOLATE as its `value`.
 *
 * @category Formatted Parts
 */
export interface MessageBiDiIsolationPart {
  type: 'bidiIsolation';
  /** LRI | RLI | FSI | PDI */
  value: '\u2066' | '\u2067' | '\u2068' | '\u2069';
}

/** @category Formatted Parts */
export interface MessageExpressionPart {
  type: string;
  source: string;
  dir?: 'ltr' | 'rtl';
  locale?: string;
  id?: string;
  parts?: Array<{ type: string; source?: string; value?: unknown }>;
  value?: unknown;
}

/** @category Formatted Parts */
export interface MessageLiteralPart {
  type: 'literal';
  value: string;
}

/** @category Formatted Parts */
export interface MessageMarkupPart {
  type: 'markup';
  kind: 'open' | 'standalone' | 'close';
  source: string;
  name: string;
  id?: string;
  options?: { [key: string]: unknown };
}

/**
 * The values returned by {@link MessageFormat.formatToParts}.
 *
 * @category Formatted Parts
 */
export type MessagePart =
  | MessageBiDiIsolationPart
  | MessageExpressionPart
  | MessageLiteralPart
  | MessageMarkupPart;
