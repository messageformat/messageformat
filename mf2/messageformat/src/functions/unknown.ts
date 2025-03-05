import type { MessageExpressionPart } from '../formatted-parts.ts';
import type { MessageValue } from '../message-value.ts';

export interface MessageUnknownValue extends MessageValue {
  readonly type: 'unknown';
  readonly source: string;
  readonly dir: 'auto';
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
  dir: 'auto',
  toParts: () => [{ type: 'unknown', source, value: input }],
  toString: () => String(input),
  valueOf: () => input
});
