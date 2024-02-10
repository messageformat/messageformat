import { parseNameValue, parseUnquotedLiteralValue } from '../cst/names.js';
import { MessageSyntaxError } from '../errors.js';
import type * as Model from './types.js';

const whitespaceChars = ['\t', '\n', '\r', ' ', '\u3000'];

export type MessageParserOptions = {
  /**
   * Parse a private annotation starting with `^` or `&`.
   * By default, private annotations are parsed as unsupported annotations.
   *
   * @returns `pos` as the position at the end of the `annotation`,
   *   not including any trailing whitespace.
   */
  privateAnnotation?: (
    source: string,
    pos: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => { pos: number; annotation: any };
};

//// Parser State ////

let pos: number;
let source: string;
let opt: MessageParserOptions;

//// Utilities & Error Wrappers ////

// These indirections allow for the function names to be mangled,
// while keeping the error class name intact.

const MissingSyntax = (pos: number, expected: string) =>
  new MessageSyntaxError(
    'missing-syntax',
    pos,
    pos + expected.length,
    expected
  );
const SyntaxError = (
  ...args: ConstructorParameters<typeof MessageSyntaxError>
) => new MessageSyntaxError(...args);

function expect(searchString: string, consume: boolean) {
  if (source.startsWith(searchString, pos)) {
    if (consume) pos += searchString.length;
  } else {
    throw MissingSyntax(pos, searchString);
  }
}

/**
 * A MessageFormat 2 parser for message formatting.
 *
 * Parses the `source` syntax representation of a message into
 * its corresponding data model representation.
 * Throws on syntax errors, but does not check for data model errors.
 */
export function parseMessage(
  source: string,
  opt?: MessageParserOptions
): Model.Message;
export function parseMessage(
  source_: string,
  opt_: MessageParserOptions = {}
): Model.Message {
  pos = 0;
  source = source_;
  opt = opt_;

  const decl = declarations();
  if (source.startsWith('.match', pos)) return selectMessage(decl);

  const quoted = decl.length > 0 || source.startsWith('{{', pos);
  const pattern_ = pattern(quoted);
  if (quoted) {
    ws();
    if (pos < source.length) {
      throw SyntaxError('extra-content', pos, source.length);
    }
  }
  return { type: 'message', declarations: decl, pattern: pattern_ };
}

function selectMessage(declarations: Model.Declaration[]): Model.SelectMessage {
  pos += 6; // '.match'
  ws();

  const selectors: Model.Expression[] = [];
  while (source[pos] === '{') {
    selectors.push(expression(false));
    ws();
  }
  if (selectors.length === 0) throw SyntaxError('empty-token', pos);

  const variants: Model.Variant[] = [];
  while (pos < source.length) {
    variants.push(variant());
    ws();
  }

  return { type: 'select', declarations, selectors, variants };
}

function variant(): Model.Variant {
  const keys: Array<Model.Literal | Model.CatchallKey> = [];
  while (pos < source.length) {
    ws(keys.length ? '{' : false);
    const next = source[pos];
    if (next === '{') break;
    if (next === '*') {
      keys.push({ type: '*' });
      pos += 1;
    } else {
      keys.push(literal(true));
    }
  }
  return { keys, value: pattern(true) };
}

function pattern(quoted: boolean): Model.Pattern {
  if (quoted) {
    if (source.startsWith('{{', pos)) pos += 2;
    else throw MissingSyntax(pos, '{{');
  }

  const pattern: Model.Pattern = [];
  loop: while (pos < source.length) {
    switch (source[pos]) {
      case '{': {
        pattern.push(expression(true));
        break;
      }
      case '}':
        if (!quoted) throw SyntaxError('parse-error', pos);
        break loop;
      default: {
        pattern.push(text());
      }
    }
  }

  if (quoted) {
    if (source.startsWith('}}', pos)) pos += 2;
    else throw MissingSyntax(pos, '}}');
  }
  return pattern;
}

function declarations(): Model.Declaration[] {
  const declarations: Model.Declaration[] = [];
  loop: while (source[pos] === '.') {
    const keyword = parseNameValue(source, pos + 1);
    switch (keyword) {
      case 'input':
        declarations.push(inputDeclaration());
        break;
      case 'local':
        declarations.push(localDeclaration());
        break;
      case 'match':
        break loop;
      case '':
        throw SyntaxError('parse-error', pos);
      default:
        declarations.push(unsupportedStatement(keyword));
    }
    ws();
  }
  return declarations;
}

function inputDeclaration(): Model.InputDeclaration {
  pos += 6; // '.input'
  ws();
  expect('{', false);
  const valueStart = pos;
  const value = expression(false);
  if (value.type === 'expression' && value.arg?.type === 'variable') {
    // @ts-expect-error TS isn't catching that value is Expression<VariableRef>
    return { type: 'input', name: value.arg.name, value };
  }
  throw SyntaxError('bad-input-expression', valueStart, pos);
}

function localDeclaration(): Model.LocalDeclaration {
  pos += 6; // '.local'
  ws(true);
  expect('$', true);
  const name_ = name();
  ws();
  expect('=', true);
  ws();
  expect('{', false);
  const value = expression(false);
  return { type: 'local', name: name_, value };
}

function unsupportedStatement(keyword: string): Model.UnsupportedStatement {
  pos += 1 + keyword.length; // '.' + keyword
  ws('{');
  const body = reservedBody();
  const expressions: (Model.Expression | Model.Markup)[] = [];
  while (source[pos] === '{') {
    if (source.startsWith('{{', pos)) break;
    expressions.push(expression(false));
    ws();
  }
  if (expressions.length === 0) throw SyntaxError('empty-token', pos);
  return { type: 'unsupported-statement', keyword, body, expressions };
}

function expression(allowMarkup: false): Model.Expression;
function expression(allowMarkup: boolean): Model.Expression | Model.Markup;
function expression(allowMarkup: boolean): Model.Expression | Model.Markup {
  const start = pos;
  pos += 1; // '{'
  ws();

  const arg = value(false);
  if (arg) ws('}');

  const sigil = source[pos];
  let annotation:
    | Model.FunctionAnnotation
    | Model.UnsupportedAnnotation
    | undefined;
  let markup: Model.Markup | undefined;
  switch (sigil) {
    case '@':
    case '}':
      break;
    case ':': {
      pos += 1; // ':'
      annotation = { type: 'function', name: identifier() };
      const options_ = options();
      if (options_.length) annotation.options = options_;
      break;
    }
    case '#':
    case '/': {
      if (arg || !allowMarkup) throw SyntaxError('parse-error', pos);
      pos += 1; // '#' or '/'
      if (sigil === '#') {
        markup = { type: 'markup', kind: 'open', name: identifier() };
        const options_ = options();
        if (options_.length) markup.options = options_;
      } else {
        markup = { type: 'markup', kind: 'close', name: identifier() };
        ws('}');
      }
      break;
    }
    case '^':
    case '&':
      annotation = privateAnnotation(sigil);
      break;
    case '!':
    case '%':
    case '*':
    case '+':
    case '<':
    case '>':
    case '?':
    case '~':
      annotation = unsupportedAnnotation(sigil);
      break;
    default:
      throw SyntaxError('parse-error', pos);
  }

  while (source[pos] === '@') attribute();
  if (markup?.kind === 'open' && source[pos] === '/') {
    // @ts-expect-error Yes, TS, this does become MarkupStandalone.
    markup.kind = 'standalone';
    pos += 1; // '/'
  }
  expect('}', true);

  if (annotation) {
    return arg
      ? { type: 'expression', arg, annotation }
      : { type: 'expression', annotation };
  }
  if (markup) return markup;
  if (!arg) throw SyntaxError('empty-token', start, pos);
  return { type: 'expression', arg };
}

/** Requires and consumes leading and trailing whitespace. */
function options() {
  ws('/}');
  const options: Model.Option[] = [];
  while (pos < source.length) {
    const next = source[pos];
    if (next === '@' || next === '/' || next === '}') break;
    const name_ = identifier();
    ws();
    expect('=', true);
    ws();
    options.push({ name: name_, value: value(true) });
    ws('/}');
  }
  return options;
}

function attribute() {
  pos += 1; // '@'
  identifier(); // name
  ws('=/}');
  if (source[pos] === '=') {
    pos += 1; // '='
    ws();
    value(true); // value
    ws('/}');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function privateAnnotation(sigil: '^' | '&'): any {
  if (opt.privateAnnotation) {
    const res = opt.privateAnnotation(source, pos);
    pos = res.pos;
    ws('}');
    return res.annotation;
  }
  return unsupportedAnnotation(sigil);
}

function unsupportedAnnotation(
  sigil: Model.UnsupportedAnnotation['sigil']
): Model.UnsupportedAnnotation {
  pos += 1; // sigil
  const src = reservedBody();
  return { type: 'unsupported-annotation', sigil, source: src };
}

function reservedBody(): string {
  const start = pos;
  loop: while (pos < source.length) {
    const next = source[pos];
    switch (next) {
      case '\\': {
        switch (source[pos + 1]) {
          case '\\':
          case '{':
          case '|':
          case '}':
            break;
          default:
            throw SyntaxError('bad-escape', pos, pos + 2);
        }
        pos += 2;
        break;
      }
      case '|':
        quotedLiteral();
        break;
      case '@':
        pos -= 1;
        ws(true);
        break loop;
      case '{':
      case '}':
        break loop;
      default: {
        const cc = next.charCodeAt(0);
        if (cc >= 0xd800 && cc < 0xe000) {
          // surrogates are invalid here
          throw SyntaxError('parse-error', pos);
        }
        pos += 1;
      }
    }
  }
  return source.substring(start, pos).trimEnd();
}

function text(): string {
  let value = '';
  let i = pos;
  loop: for (; i < source.length; ++i) {
    switch (source[i]) {
      case '\\': {
        const esc = source[i + 1];
        if (esc !== '\\' && esc !== '{' && esc !== '}') {
          throw SyntaxError('bad-escape', i, i + 2);
        }
        value += source.substring(pos, i) + esc;
        i += 1;
        pos = i + 1;
        break;
      }
      case '{':
      case '}':
        break loop;
    }
  }
  value += source.substring(pos, i);
  pos = i;
  return value;
}

function value(required: true): Model.Literal | Model.VariableRef;
function value(
  required: boolean
): Model.Literal | Model.VariableRef | undefined;
function value(
  required: boolean
): Model.Literal | Model.VariableRef | undefined {
  if (source[pos] === '$') {
    pos += 1; // '$'
    return { type: 'variable', name: name() };
  } else {
    return literal(required);
  }
}

function literal(required: true): Model.Literal;
function literal(required: boolean): Model.Literal | undefined;
function literal(required: boolean): Model.Literal | undefined {
  if (source[pos] === '|') return quotedLiteral();
  const value = parseUnquotedLiteralValue(source, pos);
  if (!value) {
    if (required) throw SyntaxError('empty-token', pos);
    else return undefined;
  }
  pos += value.length;
  return { type: 'literal', value };
}

function quotedLiteral(): Model.Literal {
  pos += 1; // '|'
  let value = '';
  for (let i = pos; i < source.length; ++i) {
    switch (source[i]) {
      case '\\': {
        const esc = source[i + 1];
        if (esc !== '\\' && esc !== '|') {
          throw SyntaxError('bad-escape', i, i + 2);
        }
        value += source.substring(pos, i) + esc;
        i += 1;
        pos = i + 1;
        break;
      }
      case '|':
        value += source.substring(pos, i);
        pos = i + 1;
        return { type: 'literal', value };
    }
  }
  throw MissingSyntax(source.length, '|');
}

function identifier(): string {
  const name_ = name();
  if (source[pos] === ':') {
    pos += 1;
    return name_ + ':' + name();
  }
  return name_;
}

function name(): string {
  const name = parseNameValue(source, pos);
  if (!name) throw SyntaxError('empty-token', pos);
  pos += name.length;
  return name;
}

function ws(required?: boolean): void;
function ws(requiredIfNotFollowedBy: string): void;
function ws(req: string | boolean): void;
function ws(req: string | boolean = false): void {
  let length = 0;
  let next = source[pos];
  while (whitespaceChars.includes(next)) {
    length += 1;
    next = source[pos + length];
  }
  pos += length;
  if (req && !length && (req === true || !req.includes(source[pos]))) {
    throw MissingSyntax(pos, "' '");
  }
}
