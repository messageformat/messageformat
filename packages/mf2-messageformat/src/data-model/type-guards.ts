/* eslint-disable @typescript-eslint/no-explicit-any */

import type { FunctionAnnotation } from './expression/function-annotation.js';
import type { Expression } from './expression/index.js';
import type { Literal } from './expression/literal.js';
import type { UnsupportedAnnotation } from './expression/unsupported-annotation.js';
import type { VariableRef } from './expression/variable-ref.js';
import type {
  CatchallKey,
  Message,
  PatternMessage,
  SelectMessage
} from './index.js';
import type { Markup } from './markup.js';

/** @beta */
export const isCatchallKey = (key: any): key is CatchallKey =>
  !!key && typeof key === 'object' && key.type === '*';

/** @beta */
export const isExpression = (part: any): part is Expression =>
  !!part && typeof part === 'object' && part.type === 'expression';

/** @beta */
export const isFunctionAnnotation = (part: any): part is FunctionAnnotation =>
  !!part && typeof part === 'object' && part.type === 'function';

/** @beta */
export const isLiteral = (part: any): part is Literal =>
  !!part && typeof part === 'object' && part.type === 'literal';

/** @beta */
export const isMarkup = (part: any): part is Markup =>
  !!part && typeof part === 'object' && part.type === 'markup';

/** @beta */
export const isMessage = (msg: any): msg is Message =>
  !!msg &&
  typeof msg === 'object' &&
  (msg.type === 'message' || msg.type === 'select');

/** @beta */
export const isPatternMessage = (msg: Message): msg is PatternMessage =>
  msg.type === 'message';

/** @beta */
export const isSelectMessage = (msg: Message): msg is SelectMessage =>
  msg.type === 'select';

/** @beta */
export const isUnsupportedAnnotation = (
  part: any
): part is UnsupportedAnnotation =>
  !!part && typeof part === 'object' && part.type === 'unsupported-annotation';

/** @beta */
export const isVariableRef = (part: any): part is VariableRef =>
  !!part && typeof part === 'object' && part.type === 'variable';
