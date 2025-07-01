import type { Node } from './data-model/types.ts';
import { cstKey } from './data-model/from-cst.ts';

/**
 * Base error class used by MessageFormat
 *
 * @category Errors
 */
export class MessageError extends Error {
  type: string;
  constructor(type: string, message: string) {
    super(message);
    this.type = type;
  }
}

/**
 * Errors in the message syntax.
 *
 * @category Errors
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

  /** @private */
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
 * @category Errors
 */
export class MessageDataModelError extends MessageSyntaxError {
  declare type:
    | 'duplicate-declaration'
    | 'duplicate-variant'
    | 'key-mismatch'
    | 'missing-fallback'
    | 'missing-selector-annotation';

  /** @private */
  constructor(type: typeof MessageDataModelError.prototype.type, node: Node) {
    const { start, end } = node[cstKey] ?? { start: -1, end: -1 };
    super(type, start, end);
  }
}

/**
 * Message runtime resolution errors
 *
 * @category Errors
 */
export class MessageResolutionError extends MessageError {
  declare type:
    | 'bad-function-result'
    | 'bad-selector'
    | 'no-match'
    | 'unknown-function'
    | 'unresolved-variable';
  source: string;
  cause?: unknown;
  constructor(
    type: typeof MessageResolutionError.prototype.type,
    message: string,
    source: string,
    cause?: unknown
  ) {
    super(type, message);
    this.source = source;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * Message runtime resolution errors
 *
 * @category Errors
 */
export class MessageFunctionError extends MessageError {
  declare type:
    | 'bad-operand'
    | 'bad-option'
    | 'bad-variant-key'
    | 'not-formattable'
    | 'unsupported-operation';
  source: string;
  constructor(
    type: typeof MessageFunctionError.prototype.type,
    message: string,
    source: string
  ) {
    super(type, message);
    this.source = source;
  }
}
