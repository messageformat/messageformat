import { MessageSyntaxError } from '../errors.js';
import type * as CST from './cst-types.js';
import type { ParseContext } from './message.js';
import { parseNameValue } from './names.js';
import { whitespaces } from './util.js';
import { parseLiteral, parseQuotedLiteral, parseVariable } from './values.js';

export function parseExpression(
  ctx: ParseContext,
  start: number
): CST.Expression {
  let pos = start + 1; // '{'
  pos += whitespaces(ctx.source, pos);

  const arg =
    ctx.source[pos] === '$'
      ? parseVariable(ctx, pos)
      : parseLiteral(ctx, pos, false);
  if (arg) pos = arg.end;

  let annotation:
    | CST.FunctionRef
    | CST.ReservedAnnotation
    | CST.Junk
    | undefined;
  let markup: CST.Markup | CST.MarkupClose | undefined;
  let junkError: MessageSyntaxError | undefined;
  pos += whitespaces(ctx.source, pos);
  switch (ctx.source[pos]) {
    case ':':
      annotation = parseFunctionRefOrMarkup(ctx, pos, 'function');
      pos = annotation.end;
      break;
    case '#':
      if (arg) ctx.onError('extra-content', arg.start, arg.end);
      markup = parseFunctionRefOrMarkup(ctx, pos, 'markup');
      pos = markup.end;
      break;
    case '/':
      if (arg) ctx.onError('extra-content', arg.start, arg.end);
      markup = parseMarkupClose(ctx, pos);
      pos = markup.end;
      break;
    case '!':
    case '@':
    case '%':
    case '^':
    case '&':
    case '*':
    case '+':
    case '<':
    case '>':
    case '?':
    case '~':
      annotation = parseReservedAnnotation(ctx, pos);
      pos = annotation.end;
      break;
    default:
      if (!arg) {
        const source = ctx.source.substring(pos, pos + 1);
        annotation = { type: 'junk', start: pos, end: pos, source };
        junkError = new MessageSyntaxError('parse-error', pos, pos + 1);
        ctx.errors.push(junkError);
      }
  }
  pos += whitespaces(ctx.source, pos);

  const open: CST.Syntax<'{'> = { start, end: start + 1, value: '{' };
  let close: CST.Syntax<'}'> | undefined;
  if (pos >= ctx.source.length) {
    ctx.onError('missing-syntax', pos, '}');
  } else {
    if (ctx.source[pos] !== '}') {
      const errStart = pos;
      while (pos < ctx.source.length && ctx.source[pos] !== '}') pos += 1;
      if (annotation?.type === 'junk') {
        annotation.end = pos;
        annotation.source = ctx.source.substring(annotation.start, pos);
        if (junkError) junkError.end = pos;
      } else {
        ctx.onError('extra-content', errStart, pos);
      }
    }
    if (ctx.source[pos] === '}') {
      close = { start: pos, end: pos + 1, value: '}' };
      pos += 1;
    }
  }
  const braces: CST.Expression['braces'] = close ? [open, close] : [open];
  return markup
    ? { type: 'expression', start, end: pos, braces, markup }
    : { type: 'expression', start, end: pos, braces, arg, annotation };
}

function parseFunctionRefOrMarkup(
  ctx: ParseContext,
  start: number,
  type: 'function'
): CST.FunctionRef;
function parseFunctionRefOrMarkup(
  ctx: ParseContext,
  start: number,
  type: 'markup'
): CST.Markup;
function parseFunctionRefOrMarkup(
  ctx: ParseContext,
  start: number,
  type: 'function' | 'markup'
): CST.FunctionRef | CST.Markup {
  let pos = start + 1; // ':' | '#'
  const name = parseNameValue(ctx.source, pos);
  if (!name) ctx.onError('empty-token', pos, pos + 1);
  const options: CST.Option[] = [];
  pos += name.length;
  let close: CST.Syntax<'/'> | undefined;
  while (pos < ctx.source.length) {
    let ws = whitespaces(ctx.source, pos);
    const next = ctx.source[pos + ws];
    if (next === '}') break;
    if (type === 'markup' && next === '/') {
      pos += ws + 1;
      close = { start: pos - 1, end: pos, value: '/' };
      ws = whitespaces(ctx.source, pos);
      if (ws > 0) ctx.onError('extra-content', pos, pos + ws);
      break;
    }
    if (ws === 0) ctx.onError('missing-syntax', pos, ' ');
    pos += ws;
    const opt = parseOption(ctx, pos);
    if (opt.end === pos) break; // error
    options.push(opt);
    pos = opt.end;
  }
  return type === 'function'
    ? { type, start, end: pos, name, options }
    : { type, start, end: pos, name, options, close };
}

function parseMarkupClose(ctx: ParseContext, start: number): CST.MarkupClose {
  let pos = start + 1; // '/'
  const name = parseNameValue(ctx.source, pos);
  if (name) pos += name.length;
  else ctx.onError('empty-token', pos, pos + 1);
  return { type: 'markup-close', start, end: pos, name };
}

// option = name [s] "=" [s] (literal / variable)
function parseOption(ctx: ParseContext, start: number): CST.Option {
  const name = parseNameValue(ctx.source, start);
  let pos = start + name.length;
  pos += whitespaces(ctx.source, pos);
  if (ctx.source[pos] === '=') pos += 1;
  else ctx.onError('missing-syntax', pos, '=');
  pos += whitespaces(ctx.source, pos);
  const value =
    ctx.source[pos] === '$'
      ? parseVariable(ctx, pos)
      : parseLiteral(ctx, pos, true);
  return { start, end: value.end, name, value };
}

// reserved       = reserved-start reserved-body
// reserved-start = "!" / "@" / "#" / "%" / "^" / "&" / "*" / "<" / ">" / "?" / "~"
// reserved-body  = *( [s] 1*(reserved-char / reserved-escape / literal))
// reserved-char  = %x00-08        ; omit HTAB and LF
//                / %x0B-0C        ; omit CR
//                / %x0E-19        ; omit SP
//                / %x21-5B        ; omit \
//                / %x5D-7A        ; omit { | }
//                / %x7E-D7FF      ; omit surrogates
//                / %xE000-10FFFF
function parseReservedAnnotation(
  ctx: ParseContext,
  start: number
): CST.ReservedAnnotation {
  const sigil = ctx.source[start] as CST.ReservedAnnotation['sigil'];
  const source = parseReservedBody(ctx, start + 1); // skip sigil
  return {
    type: 'reserved-annotation',
    start,
    end: source.end,
    sigil,
    source
  };
}

export function parseReservedBody(
  ctx: ParseContext,
  start: number
): CST.Syntax<string> {
  let pos = start;
  loop: while (pos < ctx.source.length) {
    const ch = ctx.source[pos];
    switch (ch) {
      case '\\': {
        switch (ctx.source[pos + 1]) {
          case '\\':
          case '{':
          case '|':
          case '}':
            break;
          default:
            ctx.onError('bad-escape', pos, pos + 2);
        }
        pos += 2;
        break;
      }
      case '|':
        pos = parseQuotedLiteral(ctx, pos).end;
        break;
      case '}':
        break loop;
      default: {
        const cc = ch.charCodeAt(0);
        if (cc >= 0xd800 && cc < 0xe000) {
          // surrogates are invalid here
          ctx.onError('parse-error', pos, pos + 1);
        }
        pos += 1;
      }
    }
  }
  let prev = ctx.source[pos - 1];
  while (prev === '\r' || prev === '\n' || prev === '\t' || prev === ' ') {
    pos -= 1;
    prev = ctx.source[pos - 1];
  }
  return { start, end: pos, value: ctx.source.substring(start, pos) };
}
