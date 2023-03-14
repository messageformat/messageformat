import { MessageSyntaxError, MissingCharError } from '../errors.js';
import type {
  ExpressionParsed,
  JunkParsed,
  LiteralParsed,
  MarkupStartParsed,
  MarkupEndParsed,
  NmtokenParsed,
  OptionParsed,
  PlaceholderParsed,
  VariableRefParsed
} from './data-model.js';
import { parseNameValue, parseNmtoken } from './names.js';
import { whitespaces } from './util.js';
import { parseLiteral, parseVariable } from './values.js';

// Placeholder ::= '{' (Expression | Markup | MarkupEnd)? '}'
export function parsePlaceholder(
  src: string,
  start: number,
  errors: MessageSyntaxError[]
): PlaceholderParsed {
  let pos = start + 1; // '{'
  pos += whitespaces(src, pos);

  let arg: LiteralParsed | VariableRefParsed | undefined;
  switch (src[pos]) {
    case '(':
      arg = parseLiteral(src, pos, errors);
      pos = arg.end;
      break;
    case '$': {
      arg = parseVariable(src, pos, errors);
      pos = arg.end;
      break;
    }
  }

  let body:
    | LiteralParsed
    | VariableRefParsed
    | ExpressionParsed
    | MarkupStartParsed
    | MarkupEndParsed
    | JunkParsed;
  let junkError: MessageSyntaxError | undefined;
  pos += whitespaces(src, pos);
  switch (src[pos]) {
    case ':':
    case '+':
    case '-':
      body = parseExpressionOrMarkup(src, pos, arg, errors);
      pos = body.end;
      break;
    default:
      if (arg) {
        body = arg;
      } else {
        const source = src.substring(pos, pos + 1);
        body = { type: 'junk', start: pos, end: pos, source };
        junkError = new MessageSyntaxError('parse-error', pos, pos + 1);
        errors.push(junkError);
      }
  }
  pos += whitespaces(src, pos);

  if (pos >= src.length) {
    errors.push(new MissingCharError(pos, '}'));
  } else if (src[pos] !== '}') {
    const errStart = pos;
    while (pos < src.length && src[pos] !== '}') pos += 1;
    if (body.type === 'junk') {
      body.end = pos;
      body.source = src.substring(body.start, pos);
      if (junkError) junkError.end = pos;
    } else {
      errors.push(new MessageSyntaxError('extra-content', errStart, pos));
    }
  } else {
    pos += 1;
  }

  return { type: 'placeholder', start, end: pos, body };
}

// Expression ::= Operand Annotation? | Annotation
// Operand ::= Literal | Variable
// Annotation ::= Function Option*
// Function ::= ':' Name /* ws: explicit */
// Markup ::= MarkupStart Option*
// MarkupStart ::= '+' Name /* ws: explicit */
// MarkupEnd ::= '-' Name /* ws: explicit */
function parseExpressionOrMarkup(
  src: string,
  start: number,
  operand: LiteralParsed | VariableRefParsed | undefined,
  errors: MessageSyntaxError[]
): ExpressionParsed | MarkupStartParsed | MarkupEndParsed {
  const sigil = src[start];
  let pos = start + 1; // ':' | '+' | '-'
  const name = parseNameValue(src, pos);
  if (!name) errors.push(new MessageSyntaxError('empty-token', pos, pos + 1));
  const options: OptionParsed[] = [];
  pos += name.length;
  while (pos < src.length) {
    const ws = whitespaces(src, pos);
    if (src[pos + ws] === '}') break;
    if (ws === 0) errors.push(new MissingCharError(pos, ' '));
    pos += ws;
    const opt = parseOption(src, pos, errors);
    if (opt.end === pos) break; // error
    options.push(opt);
    pos = opt.end;
  }

  const end = pos;
  if (sigil === ':') {
    return { type: 'expression', operand, start, end, name, options };
  }

  if (operand) {
    const { start, end } = operand;
    errors.unshift(new MessageSyntaxError('extra-content', start, end));
  }
  if (sigil === '+') {
    return { type: 'markup-start', start, end, name, options };
  }

  if (options.length > 0) {
    errors.push(
      new MessageSyntaxError(
        'extra-content',
        options[0].start,
        options[options.length - 1].end
      )
    );
  }
  return { type: 'markup-end', start, end, name };
}

// Option ::= Name '=' (Literal | Nmtoken | Variable)
function parseOption(
  src: string,
  start: number,
  errors: MessageSyntaxError[]
): OptionParsed {
  const name = parseNameValue(src, start);
  let pos = start + name.length;
  pos += whitespaces(src, pos);
  if (src[pos] === '=') pos += 1;
  else errors.push(new MissingCharError(pos, '='));
  pos += whitespaces(src, pos);
  let value: LiteralParsed | NmtokenParsed | VariableRefParsed;
  switch (src[pos]) {
    case '(':
      value = parseLiteral(src, pos, errors);
      break;
    case '$':
      value = parseVariable(src, pos, errors);
      break;
    default:
      value = parseNmtoken(src, pos, errors);
  }
  return { start, end: value.end, name, value };
}
