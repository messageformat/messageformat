export class MessageError extends Error {
  type:
    | 'junk-element'
    | 'missing-func'
    | 'unresolved-var'
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
    | 'bad-local-var'
    | 'bad-selector'
    | 'extra-content'
    | 'key-mismatch'
    | 'parse-error'
    | 'missing-char'
    | 'missing-fallback';
  start: number;
  end: number;
  char?: string;

  constructor(
    type: typeof MessageSyntaxError.prototype.type,
    start: number,
    end: number,
    char?: string
  ) {
    let message: string;
    switch (type) {
      case 'empty-token':
      case 'bad-escape':
      case 'bad-local-var':
      case 'bad-selector':
      case 'extra-content':
      case 'parse-error':
        message = `Syntax parse error: ${type} at ${start}`;
        break;
      case 'missing-char':
        message = `Syntax parse error: Missing character ${char} at ${start}`;
        break;
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

export class MissingCharError extends MessageSyntaxError {
  char: string;

  constructor(pos: number, char: string) {
    super('missing-char', pos, pos + 1, char);
    this.char = char;
  }
}

export class MessageDataModelError extends MessageSyntaxError {
  declare type: 'key-mismatch' | 'missing-fallback';
}
