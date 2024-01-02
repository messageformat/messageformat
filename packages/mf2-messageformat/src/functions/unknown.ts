import type { MessageValue } from './index.js';
import type { MessageExpressionPart } from '../formatted-parts.js';

export interface MessageUnknownValue extends MessageValue {
  readonly type: 'unknown';
  readonly source: string;
  readonly locale: 'und';
  toParts(): [MessageUnknownPart];
  toString(): string;
  valueOf(): unknown;
}

export interface MessageUnknownPart extends MessageExpressionPart {
  type: 'unknown';
  source: string;
  value: unknown;
}

export const unknown = (
  source: string,
  input: unknown
): MessageUnknownValue => ({
  type: 'unknown',
  source,
  locale: 'und',
  toParts: () => [{ type: 'unknown', source, value: input }],
  toString: () => String(input),
  valueOf: () => input
});
