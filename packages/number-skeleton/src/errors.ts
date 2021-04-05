/**
 * Base class for errors. In addition to a `code` and a human-friendly
 * `message`, may also includes the token `stem` as well as other fields.
 *
 * @public
 */
export class NumberFormatError extends Error {
  code: string;
  /** @internal */
  constructor(code: string, msg: string) {
    super(msg);
    this.code = code;
  }
}

/** @internal */
export class BadOptionError extends NumberFormatError {
  stem: string;
  option: string;
  constructor(stem: string, opt: string) {
    super('BAD_OPTION', `Unknown ${stem} option: ${opt}`);
    this.stem = stem;
    this.option = opt;
  }
}

/** @internal */
export class BadStemError extends NumberFormatError {
  stem: string;
  constructor(stem: string) {
    super('BAD_STEM', `Unknown stem: ${stem}`);
    this.stem = stem;
  }
}

/** @internal */
export class MaskedValueError extends NumberFormatError {
  type: string;
  prev: unknown;
  constructor(type: string, prev: unknown) {
    super('MASKED_VALUE', `Value for ${type} is set multiple times`);
    this.type = type;
    this.prev = prev;
  }
}

/** @internal */
export class MissingOptionError extends NumberFormatError {
  stem: string;
  constructor(stem: string) {
    super('MISSING_OPTION', `Required option missing for ${stem}`);
    this.stem = stem;
  }
}

/** @internal */
export class PatternError extends NumberFormatError {
  char: string;
  constructor(char: string, msg: string) {
    super('BAD_PATTERN', msg);
    this.char = char;
  }
}

/** @internal */
export class TooManyOptionsError extends NumberFormatError {
  stem: string;
  options: string[];
  constructor(stem: string, options: string[], maxOpt: number) {
    const maxOptStr = maxOpt > 1 ? `${maxOpt} options` : 'one option';
    super(
      'TOO_MANY_OPTIONS',
      `Token ${stem} only supports ${maxOptStr} (got ${options.length})`
    );
    this.stem = stem;
    this.options = options;
  }
}

/** @internal */
export class UnsupportedError extends NumberFormatError {
  stem: string;
  source?: string;
  constructor(stem: string, source?: string) {
    super('UNSUPPORTED', `The stem ${stem} is not supported`);
    this.stem = stem;
    if (source) {
      this.message += ` with value ${source}`;
      this.source = source;
    }
  }
}
