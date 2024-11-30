import { type MessageNode } from './data-model/types.ts';
import { cst } from './data-model/from-cst.ts';

/**
 * Base error class used by MessageFormat
 *
 * @beta
 */
export class MessageError extends Error {
  type:
    | 'not-formattable'
    | 'unknown-function'
    | typeof MessageResolutionError.prototype.type
    | typeof MessageSelectionError.prototype.type
    | typeof MessageSyntaxError.prototype.type;

  constructor(type: typeof MessageError.prototype.type, message: string) {
    super(message);
    this.type = type;
  }
}

/**
 * Errors in the message syntax.
 *
 * @beta
 */
export class MessageSyntaxError extends MessageError {
  declare type:
    | 'empty-token'
    | 'bad-escape'
    | 'bad-input-expression'
    | 'duplicate-attribute'
    | 'duplicate-declaration'
    | 'duplicate-option-name'
    | 'duplicate-variant'
    | 'extra-content'
    | 'key-mismatch'
    | 'parse-error'
    | 'missing-fallback'
    | 'missing-selector-annotation'
    | 'missing-syntax';
  start: number;
  end: number;

  constructor(
    type: typeof MessageSyntaxError.prototype.type,
    start: number,
    end?: number,
    expected?: string
  ) {
    let message = expected ? `Missing ${expected}` : type;
    if (start >= 0) message += ` at ${start}`;
    super(type, message);
    this.start = start;
    this.end = end ?? start + 1;
  }
}

/**
 * Errors in the message data model.
 *
 * @beta
 */
export class MessageDataModelError extends MessageSyntaxError {
  declare type:
    | 'duplicate-declaration'
    | 'duplicate-variant'
    | 'key-mismatch'
    | 'missing-fallback'
    | 'missing-selector-annotation';
  constructor(
    type: typeof MessageDataModelError.prototype.type,
    node: MessageNode
  ) {
    const { start, end } = node[cst] ?? { start: -1, end: -1 };
    super(type, start, end);
  }
}

/**
 * Message runtime resolution errors
 *
 * @beta
 */
export class MessageResolutionError extends MessageError {
  declare type:
    | 'bad-function-result'
    | 'bad-operand'
    | 'bad-option'
    | 'unresolved-variable'
    | 'unsupported-operation';
  source: string;
  constructor(
    type: typeof MessageResolutionError.prototype.type,
    message: string,
    source: string
  ) {
    super(type, message);
    this.source = source;
  }
}

/**
 * Errors in message selection.
 *
 * @beta
 */
export class MessageSelectionError extends MessageError {
  declare type: 'bad-selector' | 'no-match';
  constructor(
    type: typeof MessageSelectionError.prototype.type,
    cause?: unknown
  ) {
    super(type, `Selection error: ${type}`);
    if (cause !== undefined) this.cause = cause;
  }
}
