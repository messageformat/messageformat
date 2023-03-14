export abstract class MessageError extends Error {
  abstract type: string;
}

export class MessageSyntaxError extends MessageError {
  type:
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
        message = `Syntax parse error: ${type}`;
        break;
      case 'missing-char':
        message = `Syntax parse error: Missing character ${char}`;
        break;
      case 'key-mismatch':
      case 'missing-fallback':
        message = `Data model error: ${type}`;
    }
    super(message);
    this.type = type;
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
