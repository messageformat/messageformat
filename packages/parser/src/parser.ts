/**
 * An AST parser for ICU MessageFormat strings
 *
 * @packageDocumentation
 * @example
 * ```
 * import { parse } from '@messageformat/parser
 *
 * parse('So {wow}.')
 * [ { type: 'content', value: 'So ' },
 *   { type: 'argument', arg: 'wow' },
 *   { type: 'content', value: '.' } ]
 *
 *
 * parse('Such { thing }. { count, selectordinal, one {First} two {Second}' +
 *       '                  few {Third} other {#th} } word.')
 * [ { type: 'content', value: 'Such ' },
 *   { type: 'argument', arg: 'thing' },
 *   { type: 'content', value: '. ' },
 *   { type: 'selectordinal',
 *     arg: 'count',
 *     cases: [
 *       { key: 'one', tokens: [ { type: 'content', value: 'First' } ] },
 *       { key: 'two', tokens: [ { type: 'content', value: 'Second' } ] },
 *       { key: 'few', tokens: [ { type: 'content', value: 'Third' } ] },
 *       { key: 'other',
 *         tokens: [ { type: 'octothorpe' }, { type: 'content', value: 'th' } ] }
 *     ] },
 *   { type: 'content', value: ' word.' } ]
 *
 *
 * parse('Many{type,select,plural{ numbers}selectordinal{ counting}' +
 *                          'select{ choices}other{ some {type}}}.')
 * [ { type: 'content', value: 'Many' },
 *   { type: 'select',
 *     arg: 'type',
 *     cases: [
 *       { key: 'plural', tokens: [ { type: 'content', value: 'numbers' } ] },
 *       { key: 'selectordinal', tokens: [ { type: 'content', value: 'counting' } ] },
 *       { key: 'select', tokens: [ { type: 'content', value: 'choices' } ] },
 *       { key: 'other',
 *         tokens: [ { type: 'content', value: 'some ' }, { type: 'argument', arg: 'type' } ] }
 *     ] },
 *   { type: 'content', value: '.' } ]
 *
 *
 * parse('{Such compliance')
 * // ParseError: invalid syntax at line 1 col 7:
 * //
 * //  {Such compliance
 * //        ^
 *
 *
 * const msg = '{words, plural, zero{No words} one{One word} other{# words}}'
 * parse(msg)
 * [ { type: 'plural',
 *     arg: 'words',
 *     cases: [
 *       { key: 'zero', tokens: [ { type: 'content', value: 'No words' } ] },
 *       { key: 'one', tokens: [ { type: 'content', value: 'One word' } ] },
 *       { key: 'other',
 *         tokens: [ { type: 'octothorpe' }, { type: 'content', value: ' words' } ] }
 *     ] } ]
 *
 *
 * parse(msg, { cardinal: [ 'one', 'other' ], ordinal: [ 'one', 'two', 'few', 'other' ] })
 * // ParseError: The plural case zero is not valid in this locale at line 1 col 17:
 * //
 * //   {words, plural, zero{
 * //                   ^
 * ```
 */

import { lexer } from './lexer.js';
import { Lexer, Token as LexerToken } from 'moo';

/** @internal */
export type Token = Content | PlainArg | FunctionArg | Select | Octothorpe;

/**
 * Text content of the message
 *
 * @public
 */
export interface Content {
  type: 'content';
  value: string;
  ctx: Context;
}

/**
 * A simple placeholder
 *
 * @public
 * @remarks
 * `arg` identifies an input variable, the value of which is used directly in the output.
 */
export interface PlainArg {
  type: 'argument';
  arg: string;
  ctx: Context;
}

/**
 * A placeholder for a mapped argument
 *
 * @public
 * @remarks
 * `arg` identifies an input variable, the value of which is passed to the function identified by `key`, with `param` as an optional argument.
 * The output of the function is used in the output.
 *
 * In strict mode, `param` (if defined) may only be an array containing one {@link Content} token.
 */
export interface FunctionArg {
  type: 'function';
  arg: string;
  key: string;
  param?: Array<Content | PlainArg | FunctionArg | Select | Octothorpe>;
  ctx: Context;
}

/**
 * A selector between multiple variants
 *
 * @public
 * @remarks
 * The value of the `arg` input variable determines which of the `cases` is used as the output value of this placeholder.
 *
 * For `plural` and `selectordinal`, the value of `arg` is expected to be numeric, and will be matched either to an exact case with a key like `=3`,
 * or to a case with a key that has a matching plural category as the input number.
 */
export interface Select {
  type: 'plural' | 'select' | 'selectordinal';
  arg: string;
  cases: SelectCase[];
  pluralOffset?: number;
  ctx: Context;
}

/**
 * A case within a {@link Select}
 *
 * @public
 */
export interface SelectCase {
  key: string;
  tokens: Array<Content | PlainArg | FunctionArg | Select | Octothorpe>;
  ctx: Context;
}

/**
 * Represents the `#` character
 *
 * @public
 * @remarks
 * Within a `plural` or `selectordinal` {@link Select}, the `#` character should be replaced with a formatted representation of the Select's input value.
 */
export interface Octothorpe {
  type: 'octothorpe';
  ctx: Context;
}

/**
 * The parsing context for a token
 *
 * @public
 */
export interface Context {
  /** Token start index from the beginning of the input string */
  offset: number;

  /** Token start line number, starting from 1 */
  line: number;

  /** Token start column, starting from 1 */
  col: number;

  /** The raw input source for the token */
  text: string;

  /** The number of line breaks consumed while parsing the token */
  lineBreaks: number;
}

const getContext = (lt: LexerToken): Context => ({
  offset: lt.offset,
  line: lt.line,
  col: lt.col,
  text: lt.text,
  lineBreaks: lt.lineBreaks
});

const isSelectType = (type: string): type is Select['type'] =>
  type === 'plural' || type === 'select' || type === 'selectordinal';

function strictArgStyleParam(lt: LexerToken, param: Token[]) {
  let value = '';
  let text = '';
  for (const p of param) {
    const pText = p.ctx.text;
    text += pText;
    switch (p.type) {
      case 'content':
        value += p.value;
        break;
      case 'argument':
      case 'function':
      case 'octothorpe':
        value += pText;
        break;
      default:
        throw new ParseError(
          lt,
          `Unsupported part in strict mode function arg style: ${pText}`
        );
    }
  }
  const c: Content = {
    type: 'content',
    value: value.trim(),
    ctx: Object.assign({}, param[0].ctx, { text })
  };
  return [c];
}

const strictArgTypes = [
  'number',
  'date',
  'time',
  'spellout',
  'ordinal',
  'duration'
];

const defaultPluralKeys = ['zero', 'one', 'two', 'few', 'many', 'other'];

/**
 * Thrown by {@link parse} on error
 *
 * @public
 */
export class ParseError extends Error {
  /** @internal */
  constructor(lt: LexerToken | null, msg: string) {
    super(lexer.formatError(lt as LexerToken, msg));
  }
}

class Parser {
  lexer: Lexer;
  strict: boolean;
  cardinalKeys: string[];
  ordinalKeys: string[];
  strictPluralKeys: boolean;

  constructor(src: string, opt: ParseOptions) {
    this.lexer = lexer.reset(src);
    this.cardinalKeys = (opt && opt.cardinal) || defaultPluralKeys;
    this.ordinalKeys = (opt && opt.ordinal) || defaultPluralKeys;
    this.strict = (opt && opt.strict) || false;
    this.strictPluralKeys = (opt && opt.strictPluralKeys) ?? true;
  }

  parse() {
    return this.parseBody(false, true);
  }

  checkSelectKey(lt: LexerToken, type: Select['type'], key: string) {
    if (key[0] === '=') {
      if (type === 'select')
        throw new ParseError(lt, `The case ${key} is not valid with select`);
    } else if (type !== 'select') {
      const keys = type === 'plural' ? this.cardinalKeys : this.ordinalKeys;
      if (this.strictPluralKeys && keys.length > 0 && !keys.includes(key)) {
        const msg = `The ${type} case ${key} is not valid in this locale`;
        throw new ParseError(lt, msg);
      }
    }
  }

  parseSelect(
    { value: arg }: LexerToken,
    inPlural: boolean,
    ctx: Context,
    type: Select['type']
  ): Select {
    const sel: Select = { type, arg, cases: [], ctx };
    if (type === 'plural' || type === 'selectordinal') inPlural = true;
    else if (this.strict) inPlural = false;
    for (const lt of this.lexer) {
      switch (lt.type) {
        case 'offset':
          if (type === 'select')
            throw new ParseError(lt, 'Unexpected plural offset for select');
          if (sel.cases.length > 0)
            throw new ParseError(lt, 'Plural offset must be set before cases');
          sel.pluralOffset = Number(lt.value);
          ctx.text += lt.text;
          ctx.lineBreaks += lt.lineBreaks;
          break;
        case 'case': {
          this.checkSelectKey(lt, type, lt.value);
          sel.cases.push({
            key: lt.value,
            tokens: this.parseBody(inPlural),
            ctx: getContext(lt)
          });
          break;
        }
        case 'end':
          return sel;
        /* istanbul ignore next: never happens */
        default:
          throw new ParseError(lt, `Unexpected lexer token: ${lt.type}`);
      }
    }
    throw new ParseError(null, 'Unexpected message end');
  }

  parseArgToken(
    lt: LexerToken,
    inPlural: boolean
  ): PlainArg | FunctionArg | Select {
    const ctx = getContext(lt);
    const argType = this.lexer.next();
    if (!argType) throw new ParseError(null, 'Unexpected message end');
    ctx.text += argType.text;
    ctx.lineBreaks += argType.lineBreaks;
    if (
      this.strict &&
      (argType.type === 'func-simple' || argType.type === 'func-args') &&
      !strictArgTypes.includes(argType.value)
    ) {
      const msg = `Invalid strict mode function arg type: ${argType.value}`;
      throw new ParseError(lt, msg);
    }
    switch (argType.type) {
      case 'end':
        return { type: 'argument', arg: lt.value, ctx };
      case 'func-simple': {
        const end = this.lexer.next();
        if (!end) throw new ParseError(null, 'Unexpected message end');
        /* istanbul ignore if: never happens */
        if (end.type !== 'end')
          throw new ParseError(end, `Unexpected lexer token: ${end.type}`);
        ctx.text += end.text;
        if (isSelectType(argType.value.toLowerCase()))
          throw new ParseError(
            argType,
            `Invalid type identifier: ${argType.value}`
          );
        return {
          type: 'function',
          arg: lt.value,
          key: argType.value,
          ctx
        };
      }
      case 'func-args': {
        if (isSelectType(argType.value.toLowerCase())) {
          const msg = `Invalid type identifier: ${argType.value}`;
          throw new ParseError(argType, msg);
        }
        let param = this.parseBody(this.strict ? false : inPlural);
        if (this.strict && param.length > 0)
          param = strictArgStyleParam(lt, param);
        return {
          type: 'function',
          arg: lt.value,
          key: argType.value,
          param,
          ctx
        };
      }
      case 'select':
        /* istanbul ignore else: never happens */
        if (isSelectType(argType.value))
          return this.parseSelect(lt, inPlural, ctx, argType.value);
        else
          throw new ParseError(
            argType,
            `Unexpected select type ${argType.value}`
          );
      /* istanbul ignore next: never happens */
      default:
        throw new ParseError(
          argType,
          `Unexpected lexer token: ${argType.type}`
        );
    }
  }

  parseBody(
    inPlural: false,
    atRoot: true
  ): Array<Content | PlainArg | FunctionArg | Select>;
  parseBody(inPlural: boolean): Token[];
  parseBody(inPlural: boolean, atRoot?: boolean): Token[] {
    const tokens: Token[] = [];
    let content: Content | null = null;
    for (const lt of this.lexer) {
      if (lt.type === 'argument') {
        if (content) content = null;
        tokens.push(this.parseArgToken(lt, inPlural));
      } else if (lt.type === 'octothorpe' && inPlural) {
        if (content) content = null;
        tokens.push({ type: 'octothorpe', ctx: getContext(lt) });
      } else if (lt.type === 'end' && !atRoot) {
        return tokens;
      } else {
        let value = lt.value;
        if (!inPlural && lt.type === 'quoted' && value[0] === '#') {
          if (value.includes('{')) {
            const errMsg = `Unsupported escape pattern: ${value}`;
            throw new ParseError(lt, errMsg);
          }
          value = lt.text;
        }
        if (content) {
          content.value += value;
          content.ctx.text += lt.text;
          content.ctx.lineBreaks += lt.lineBreaks;
        } else {
          content = { type: 'content', value, ctx: getContext(lt) };
          tokens.push(content);
        }
      }
    }
    if (atRoot) return tokens;
    throw new ParseError(null, 'Unexpected message end');
  }
}

/**
 * One of the valid {@link http://cldr.unicode.org/index/cldr-spec/plural-rules | Unicode CLDR} plural category keys
 *
 * @public
 */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * Options for the parser
 *
 * @public
 */
export interface ParseOptions {
  /**
   * Array of valid plural categories for the current locale, used to validate `plural` keys.
   *
   * If undefined, the full set of valid {@link PluralCategory} keys is used.
   * To disable this check, pass in an empty array.
   */
  cardinal?: PluralCategory[];

  /**
   * Array of valid plural categories for the current locale, used to validate `selectordinal` keys.
   *
   * If undefined, the full set of valid {@link PluralCategory} keys is used.
   * To disable this check, pass in an empty array.
   */
  ordinal?: PluralCategory[];

  /**
   * By default, the parsing applies a few relaxations to the ICU MessageFormat spec.
   * Setting `strict: true` will disable these relaxations.
   *
   * @remarks
   * - The `argType` of `simpleArg` formatting functions will be restricted to the set of
   *   `number`, `date`, `time`, `spellout`, `ordinal`, and `duration`,
   *   rather than accepting any lower-case identifier that does not start with a number.
   *
   * - The optional `argStyle` of `simpleArg` formatting functions will not be parsed as any other text, but instead as the spec requires:
   *   "In argStyleText, every single ASCII apostrophe begins and ends quoted literal text, and unquoted \{curly braces\} must occur in matched pairs."
   *
   * - Inside a `plural` or `selectordinal` statement, a pound symbol (`#`) is replaced with the input number.
   *   By default, `#` is also parsed as a special character in nested statements too, and can be escaped using apostrophes (`'#'`).
   *   In strict mode `#` will be parsed as a special character only directly inside a `plural` or `selectordinal` statement.
   *   Outside those, `#` and `'#'` will be parsed as literal text.
   */
  strict?: boolean;

  /**
   * By default, the parser will reject any plural keys that are not valid {@link http://cldr.unicode.org/index/cldr-spec/plural-rules | Unicode CLDR}
   * plural category keys.
   * Setting `strictPluralKeys: false` will disable this check.
   */
  strictPluralKeys?: boolean;
}

/**
 * Parse an input string into an array of tokens
 *
 * @public
 * @remarks
 * The parser only supports the default `DOUBLE_OPTIONAL`
 * {@link http://www.icu-project.org/apiref/icu4c/messagepattern_8h.html#af6e0757e0eb81c980b01ee5d68a9978b | apostrophe mode}.
 */
export function parse(
  src: string,
  options: ParseOptions = {}
): Array<Content | PlainArg | FunctionArg | Select> {
  const parser = new Parser(src, options);
  return parser.parse();
}
