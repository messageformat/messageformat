import { lexer } from './lexer.js';
import { Lexer, Token as LexerToken } from 'moo';

export interface Context {
  offset: number;
  line: number;
  col: number;
  text: string;
  lineBreaks: number;
}

export type BodyToken = Content | Argument | Select | Function | Octothorpe;

export interface Content {
  type: 'content';
  value: string;
  ctx: Context;
}

export interface Argument {
  type: 'argument';
  arg: string;
  ctx: Context;
}

export interface Select {
  type: 'plural' | 'select' | 'selectordinal';
  arg: string;
  cases: SelectCase[];
  pluralOffset?: number;
  ctx: Context;
}

export interface SelectCase {
  key: string;
  tokens: BodyToken[];
  ctx: Context;
}

export interface Octothorpe {
  type: 'octothorpe';
  ctx: Context;
}

export interface Function {
  type: 'function';
  arg: string;
  key: string;
  param?: BodyToken[];
  ctx: Context;
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

function strictArgStyleParam(lt: LexerToken, param: BodyToken[]) {
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

export class ParseError extends Error {
  constructor(lt: LexerToken | null, msg: string) {
    super(lexer.formatError(lt as LexerToken, msg));
  }
}

class Parser {
  lexer: Lexer;
  strict: boolean;
  cardinalKeys: string[];
  ordinalKeys: string[];

  constructor(src: string, opt: ParseOptions) {
    this.lexer = lexer.reset(src);
    this.cardinalKeys = (opt && opt.cardinal) || defaultPluralKeys;
    this.ordinalKeys = (opt && opt.ordinal) || defaultPluralKeys;
    this.strict = (opt && opt.strict) || false;
  }

  parse() {
    return this.parseBody(false, true);
  }

  checkSelectKey(lt: LexerToken, type: Select['type'], key: string) {
    let err = '';
    if (key[0] === '=') {
      if (type === 'select') err = `The case ${key} is not valid with select`;
    } else if (type === 'plural' && !this.cardinalKeys.includes(key)) {
      err = `The plural case ${key} is not valid in this locale`;
    } else if (type === 'selectordinal' && !this.ordinalKeys.includes(key)) {
      err = `The selectordinal case ${key} is not valid in this locale`;
    }
    if (err) throw new ParseError(lt, err);
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
  ): Argument | Select | Function {
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
        ctx.text += '}';
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
  ): (Content | Argument | Select | Function)[];
  parseBody(inPlural: boolean): BodyToken[];
  parseBody(inPlural: boolean, atRoot?: boolean): BodyToken[] {
    const tokens: BodyToken[] = [];
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

export interface ParseOptions {
  /**
   * Array of valid plural categories for the current locale, used to validate `plural` keys.
   *
   * If undefined, the full set of valid [Unicode CLDR](http://cldr.unicode.org/index/cldr-spec/plural-rules) keys is used:
   * `'zero', 'one', 'two', 'few', 'many', 'other'`.
   * To disable this check, pass in an empty array.
   */
  cardinal?: Array<'zero' | 'one' | 'two' | 'few' | 'many' | 'other'>;

  /**
   * Array of valid plural categories for the current locale, used to validate `selectordinal` keys.
   *
   * If undefined, the full set of valid [Unicode CLDR](http://cldr.unicode.org/index/cldr-spec/plural-rules) keys is used:
   * `'zero', 'one', 'two', 'few', 'many', 'other'`.
   * To disable this check, pass in an empty array.
   */
  ordinal?: Array<'zero' | 'one' | 'two' | 'few' | 'many' | 'other'>;

  /**
   * By default, the parsing applies a few relaxations to the ICU MessageFormat spec.
   * Setting `strict: true` will disable these relaxations:
   *   - The `argType` of `simpleArg` formatting functions will be restricted to the set of
   *     `number`, `date`, `time`, `spellout`, `ordinal`, and `duration`,
   *     rather than accepting any lower-case identifier that does not start with a number.
   *   - The optional `argStyle` of `simpleArg` formatting functions will not be parsed as any other text, but instead as the spec requires:
   *     "In argStyleText, every single ASCII apostrophe begins and ends quoted literal text, and unquoted {curly braces} must occur in matched pairs."
   *   - Inside a `plural` or `selectordinal` statement, a pound symbol (`#`) is replaced with the input number.
   *     By default, `#` is also parsed as a special character in nested statements too, and can be escaped using apostrophes (`'#'`).
   *     In strict mode `#` will be parsed as a special character only directly inside a `plural` or `selectordinal` statement.
   *     Outside those, `#` and `'#'` will be parsed as literal text.
   */
  strict?: boolean;
}

/**
 * An AST parser for ICU MessageFormat strings – part of [messageformat](https://messageformat.github.io/).
 *
 * @remarks
 * The parser only supports the default `DOUBLE_OPTIONAL`
 * [apostrophe mode](http://www.icu-project.org/apiref/icu4c/messagepattern_8h.html#af6e0757e0eb81c980b01ee5d68a9978b).
 */
export function parse(
  src: string,
  options: ParseOptions = {}
): (Content | Argument | Select | Function)[] {
  const parser = new Parser(src, options);
  return parser.parse();
}
