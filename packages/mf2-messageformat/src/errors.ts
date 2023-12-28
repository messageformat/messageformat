export class MessageError extends Error {
  type:
    | 'missing-func'
    | 'not-formattable'
    | typeof MessageResolutionError.prototype.type
    | typeof MessageSelectionError.prototype.type
    | typeof MessageSyntaxError.prototype.type;

  constructor(type: typeof MessageError.prototype.type, message: string) {
    super(message);
    this.type = type;
  }
}

export class MessageSyntaxError extends MessageError {
  declare type:
    | 'empty-token'
    | 'bad-escape'
    | 'bad-input-expression'
    | 'bad-selector'
    | 'duplicate-declaration'
    | 'extra-content'
    | 'forward-reference'
    | 'key-mismatch'
    | 'parse-error'
    | 'missing-fallback'
    | 'missing-syntax';
  start: number;
  end: number;
  expected?: string;

  constructor(
    type: typeof MessageSyntaxError.prototype.type,
    start: number,
    end: number,
    expected?: string
  ) {
    let message: string;
    switch (type) {
      case 'empty-token':
      case 'bad-escape':
      case 'bad-input-expression':
      case 'bad-selector':
      case 'extra-content':
      case 'parse-error':
        message = `Syntax parse error: ${type} at ${start}`;
        break;
      case 'missing-syntax':
        message = `Syntax parse error: Missing ${expected} at ${start}`;
        break;
      case 'duplicate-declaration':
      case 'forward-reference':
      case 'key-mismatch':
      case 'missing-fallback':
        message = `Data model error: ${type}`;
        if (start >= 0) message += ` at ${start}`;
    }
    super(type, message);
    this.start = start;
    this.end = end;
  }
}

export class MissingSyntaxError extends MessageSyntaxError {
  expected: string;

  constructor(pos: number, expected: string) {
    super('missing-syntax', pos, pos + expected.length, expected);
    this.expected = expected;
  }
}

export class MessageDataModelError extends MessageSyntaxError {
  declare type:
    | 'duplicate-declaration'
    | 'forward-reference'
    | 'key-mismatch'
    | 'missing-fallback';
}

export class MessageResolutionError extends MessageError {
  declare type:
    | 'bad-input'
    | 'bad-option'
    | 'unresolved-var'
    | 'unsupported-annotation'
    | 'unsupported-statement';
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

export class MessageSelectionError extends MessageError {
  declare type: 'no-match' | 'not-selectable';
  constructor(type: typeof MessageSelectionError.prototype.type) {
    super(type, `Selection error: ${type}`);
  }
}
