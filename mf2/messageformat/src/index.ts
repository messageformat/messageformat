/**
 * @module
 * @showGroups
 */

import type * as Model from './data-model/types.ts';
export type { Model };
export type * from './formatted-parts.ts';

export { parseMessage } from './data-model/parse.ts';
export { stringifyMessage } from './data-model/stringify.ts';
export {
  isCatchallKey,
  isExpression,
  isFunctionRef,
  isLiteral,
  isMarkup,
  isMessage,
  isPatternMessage,
  isSelectMessage,
  isVariableRef
} from './data-model/type-guards.ts';
export { validate } from './data-model/validate.ts';
export { visit } from './data-model/visit.ts';
export {
  MessageDataModelError,
  MessageError,
  MessageResolutionError,
  MessageSelectionError,
  MessageSyntaxError
} from './errors.ts';
export { MessageFormat, MessageFormatOptions } from './messageformat.ts';
