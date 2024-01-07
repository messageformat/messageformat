import type { MessageExpressionPart } from '../formatted-parts.js';

export type { MessageFunctionContext } from '../data-model/function-context.js';
export { type MessageDateTime, datetime } from './datetime.js';
export { type MessageFallback, fallback } from './fallback.js';
export {
  type MessageNumber,
  integer,
  number,
  ordinal,
  plural
} from './number.js';
export { type MessageString, string } from './string.js';
export { type MessageUnknownValue, unknown } from './unknown.js';

export interface MessageValue {
  readonly type: string;
  readonly locale: string;
  readonly source: string;
  readonly options?: Readonly<object>;
  selectKey?: (keys: Set<string>) => string | null;
  toParts?: () => MessageExpressionPart[];
  toString?: () => string;
  valueOf?: () => unknown;
}
