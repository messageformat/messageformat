import { parseNameValue, parseUnquotedLiteralValue } from '../cst/names.ts';
import { MessageSyntaxError } from '../errors.ts';
import type * as Model from './types.ts';

const bidiChars = new Set('\u061C\u200E\u200F\u2066\u2067\u2068\u2069');
const whitespaceChars = new Set('\t\n\r \u3000');

//// Parser State ////

let pos: number;
let source: string;

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
export function parseMessage(source: string): Model.Message;
export function parseMessage(source_: string): Model.Message {
  pos = 0;
  source = source_;

  const decl = declarations();
  if (source.startsWith('.match', pos)) return selectMessage(decl);

  const quoted = decl.length > 0 || source.startsWith('{{', pos);
  if (!quoted && pos > 0) pos = 0;
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
  ws(true);

  const selectors: Model.VariableRef[] = [];
  while (source[pos] === '$') {
    selectors.push(variable());
    ws(true);
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
      const key = literal(true);
      key.value = key.value.normalize();
      keys.push(key);
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
  ws();
  loop: while (source[pos] === '.') {
    const keyword = source.substr(pos, 6);
    switch (keyword) {
      case '.input':
        declarations.push(inputDeclaration());
        break;
      case '.local':
        declarations.push(localDeclaration());
        break;
      case '.match':
        break loop;
      default:
        throw SyntaxError('parse-error', pos);
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

function expression(allowMarkup: false): Model.Expression;
function expression(allowMarkup: boolean): Model.Expression | Model.Markup;
function expression(allowMarkup: boolean): Model.Expression | Model.Markup {
  const start = pos;
  pos += 1; // '{'
  ws();

  const arg = value(false);
  if (arg) ws('}');

  const sigil = source[pos];
  let functionRef: Model.FunctionRef | undefined;
  let markup: Model.Markup | undefined;
  switch (sigil) {
    case '@':
    case '}':
      break;
    case ':': {
      pos += 1; // ':'
      functionRef = { type: 'function', name: identifier() };
      const options_ = options();
      if (options_) functionRef.options = options_;
      break;
    }
    case '#':
    case '/': {
      if (arg || !allowMarkup) throw SyntaxError('parse-error', pos);
      pos += 1; // '#' or '/'
      const kind = sigil === '#' ? 'open' : 'close';
      markup = { type: 'markup', kind, name: identifier() };
      const options_ = options();
      if (options_) markup.options = options_;
      break;
    }
    default:
      throw SyntaxError('parse-error', pos);
  }

  const attributes_ = attributes();
  if (markup?.kind === 'open' && source[pos] === '/') {
    markup.kind = 'standalone';
    pos += 1; // '/'
  }
  expect('}', true);

  if (functionRef) {
    const exp: Model.Expression = arg
      ? { type: 'expression', arg, functionRef: functionRef }
      : { type: 'expression', functionRef: functionRef };
    if (attributes_) exp.attributes = attributes_;
    return exp;
  }
  if (markup) {
    if (attributes_) markup.attributes = attributes_;
    return markup;
  }
  if (!arg) throw SyntaxError('empty-token', start, pos);
  return attributes_
    ? { type: 'expression', arg, attributes: attributes_ }
    : { type: 'expression', arg };
}

/** Requires and consumes leading and trailing whitespace. */
function options() {
  ws('/}');
  const options: Model.Options = new Map();
  let isEmpty = true;
  while (pos < source.length) {
    const next = source[pos];
    if (next === '@' || next === '/' || next === '}') break;
    const start = pos;
    const name_ = identifier();
    if (options.has(name_)) {
      throw SyntaxError('duplicate-option-name', start, pos);
    }
    ws();
    expect('=', true);
    ws();
    options.set(name_, value(true));
    isEmpty = false;
    ws('/}');
  }
  return isEmpty ? null : options;
}

function attributes() {
  const attributes: Model.Attributes = new Map();
  let isEmpty = true;
  while (source[pos] === '@') {
    const start = pos;
    pos += 1; // '@'
    const name_ = identifier();
    if (attributes.has(name_)) {
      throw SyntaxError('duplicate-attribute', start, pos);
    }
    ws('=/}');
    if (source[pos] === '=') {
      pos += 1; // '='
      ws();
      attributes.set(name_, literal(true));
      ws('/}');
    } else {
      attributes.set(name_, true);
    }
    isEmpty = false;
  }
  return isEmpty ? null : attributes;
}

function text(): string {
  let value = '';
  let i = pos;
  loop: for (; i < source.length; ++i) {
    switch (source[i]) {
      case '\\': {
        const esc = source[i + 1];
        if (!'\\{|}'.includes(esc)) throw SyntaxError('bad-escape', i, i + 2);
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
  return source[pos] === '$' ? variable() : literal(required);
}

function variable(): Model.VariableRef {
  pos += 1; // '$'
  return { type: 'variable', name: name() };
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
        if (!'\\{|}'.includes(esc)) throw SyntaxError('bad-escape', i, i + 2);
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
  pos = name.end;
  return name.value;
}

function ws(required?: boolean): void;
function ws(requiredIfNotFollowedBy: string): void;
function ws(required: string | boolean): void;
function ws(req: string | boolean = false): void {
  let next = source[pos];
  let hasWS = false;
  if (req) {
    while (bidiChars.has(next)) next = source[++pos];
    while (whitespaceChars.has(next)) {
      next = source[++pos];
      hasWS = true;
    }
  }
  while (bidiChars.has(next) || whitespaceChars.has(next)) next = source[++pos];
  if (req && !hasWS && (req === true || !req.includes(source[pos]))) {
    throw MissingSyntax(pos, "' '");
  }
}
