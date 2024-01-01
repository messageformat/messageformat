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
  const { source } = ctx;
  const id = parseIdentifier(ctx, start + 1);
  let pos = id.end;
  const options: CST.Option[] = [];
  let close: CST.Syntax<'/'> | undefined;
  while (pos < source.length) {
    let ws = whitespaces(source, pos);
    const next = source[pos + ws];
    if (next === '}') break;
    if (type === 'markup' && next === '/') {
      pos += ws + 1;
      close = { start: pos - 1, end: pos, value: '/' };
      ws = whitespaces(source, pos);
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
    ? { type, start, end: pos, name: id.parts, options }
    : { type, start, end: pos, name: id.parts, options, close };
}

function parseMarkupClose(ctx: ParseContext, start: number): CST.MarkupClose {
  const id = parseIdentifier(ctx, start + 1);
  return { type: 'markup-close', start, end: id.end, name: id.parts };
}

function parseOption(ctx: ParseContext, start: number): CST.Option {
  const id = parseIdentifier(ctx, start);
  let pos = id.end;
  pos += whitespaces(ctx.source, pos);
  if (ctx.source[pos] === '=') pos += 1;
  else ctx.onError('missing-syntax', pos, '=');
  pos += whitespaces(ctx.source, pos);
  const value =
    ctx.source[pos] === '$'
      ? parseVariable(ctx, pos)
      : parseLiteral(ctx, pos, true);
  return { start, end: value.end, name: id.parts, value };
}

function parseIdentifier(
  ctx: ParseContext,
  start: number
): { parts: CST.Identifier; end: number } {
  const { source } = ctx;
  const str0 = parseNameValue(source, start);
  if (!str0) {
    ctx.onError('empty-token', start, start + 1);
    return { parts: [{ start, end: start, value: '' }], end: start };
  }
  let pos = start + str0.length;
  const id0 = { start, end: pos, value: str0 };
  if (source[pos] !== ':') return { parts: [id0], end: pos };

  const sep = { start: pos, end: pos + 1, value: ':' as const };
  pos += 1;

  const str1 = parseNameValue(source, pos);
  if (str1) {
    const end = pos + str1.length;
    const id1 = { start: pos, end, value: str1 };
    return { parts: [id0, sep, id1], end };
  } else {
    ctx.onError('empty-token', pos, pos + 1);
    return { parts: [id0, sep], end: pos };
  }
}

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
