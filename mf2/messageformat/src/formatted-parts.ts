import type { MessageDateTimePart } from './functions/datetime.ts';
import type { MessageFallbackPart } from './functions/fallback.ts';
import type { MessageNumberPart } from './functions/number.ts';
import type { MessageStringPart } from './functions/string.ts';
import type { MessageUnknownPart } from './functions/unknown.ts';

export type {
  MessageDateTimePart,
  MessageFallbackPart,
  MessageNumberPart,
  MessageStringPart,
  MessageUnknownPart
};

/**
 * These are always paired in the output.
 * The first part has
 * - U+2066 LEFT-TO-RIGHT ISOLATE,
 * - U+2067 RIGHT-TO-LEFT ISOLATE, or
 * - U+2068 FIRST STRONG ISOLATE
 *
 * as its `value`,
 * and an ending isolation part has U+2069 POP DIRECTIONAL ISOLATE as its `value`.
 *
 * @category Formatted Parts
 */
export interface MessageBiDiIsolationPart {
  type: 'bidiIsolation';
  /** LRI | RLI | FSI | PDI */
  value: '\u2066' | '\u2067' | '\u2068' | '\u2069';
}

/**
 * The base formatted part for all expressions.
 *
 * @category Formatted Parts
 */
export interface MessageExpressionPart<P extends string> {
  type: P;
  source: string;
  dir?: 'ltr' | 'rtl';
  locale?: string;
  id?: string;
  parts?: Array<{ type: string; source?: string; value?: unknown }>;
  value?: unknown;
}

/** @category Formatted Parts */
export interface MessageTextPart {
  type: 'text';
  value: string;
}

/**
 * The formatted part for a markup placeholder.
 *
 * @category Formatted Parts
 */
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
export type MessagePart<P extends string> =
  | MessageBiDiIsolationPart
  | MessageFallbackPart
  | MessageMarkupPart
  | MessageNumberPart
  | MessageStringPart
  | MessageTextPart
  | MessageUnknownPart
  | MessageExpressionPart<
      Exclude<
        P,
        (
          | MessageBiDiIsolationPart
          | MessageFallbackPart
          | MessageMarkupPart
          | MessageNumberPart
          | MessageStringPart
          | MessageTextPart
          | MessageUnknownPart
        )['type']
      >
    >;
