/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  CatchallKey,
  Expression,
  FunctionRef,
  Literal,
  Markup,
  Message,
  PatternMessage,
  SelectMessage,
  VariableRef
} from './types.ts';

/** @category Message Data Model */
export const isCatchallKey = (key: any): key is CatchallKey =>
  !!key && typeof key === 'object' && key.type === '*';

/** @category Message Data Model */
export const isExpression = (part: any): part is Expression =>
  !!part && typeof part === 'object' && part.type === 'expression';

/** @category Message Data Model */
export const isFunctionRef = (part: any): part is FunctionRef =>
  !!part && typeof part === 'object' && part.type === 'function';

/** @category Message Data Model */
export const isLiteral = (part: any): part is Literal =>
  !!part && typeof part === 'object' && part.type === 'literal';

/** @category Message Data Model */
export const isMarkup = (part: any): part is Markup =>
  !!part && typeof part === 'object' && part.type === 'markup';

/** @category Message Data Model */
export const isMessage = (msg: any): msg is Message =>
  !!msg &&
  typeof msg === 'object' &&
  (msg.type === 'message' || msg.type === 'select');

/** @category Message Data Model */
export const isPatternMessage = (msg: Message): msg is PatternMessage =>
  msg.type === 'message';

/** @category Message Data Model */
export const isSelectMessage = (msg: Message): msg is SelectMessage =>
  msg.type === 'select';

/** @category Message Data Model */
export const isVariableRef = (part: any): part is VariableRef =>
  !!part && typeof part === 'object' && part.type === 'variable';
