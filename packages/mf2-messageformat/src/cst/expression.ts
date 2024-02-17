import { MessageSyntaxError } from '../errors.js';
import type { ParseContext } from './parse-cst.js';
import { parseNameValue } from './names.js';
import type * as CST from './types.js';
import { whitespaceChars, whitespaces } from './util.js';
import { parseLiteral, parseQuotedLiteral, parseVariable } from './values.js';

export function parseExpression(
  ctx: ParseContext,
  start: number
): CST.Expression {
  const { source } = ctx;
  let pos = start + 1; // '{'
  pos += whitespaces(source, pos);

  const arg =
    source[pos] === '$'
      ? parseVariable(ctx, pos)
      : parseLiteral(ctx, pos, false);
  if (arg) {
    pos = arg.end;
    const ws = whitespaces(source, pos);
    if (ws === 0 && source[pos] !== '}') {
      ctx.onError('missing-syntax', pos, ' ');
    }
    pos += ws;
  }

  let annotation:
    | CST.FunctionRef
    | CST.ReservedAnnotation
    | CST.Junk
    | undefined;
  let markup: CST.Markup | undefined;
  let junkError: MessageSyntaxError | undefined;
  switch (source[pos]) {
    case ':':
      annotation = parseFunctionRefOrMarkup(ctx, pos, 'function');
      pos = annotation.end;
      break;
    case '#':
    case '/':
      if (arg) ctx.onError('extra-content', arg.start, arg.end);
      markup = parseFunctionRefOrMarkup(ctx, pos, 'markup');
      pos = markup.end;
      break;
    case '!':
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
    case '@':
    case '}':
      if (!arg) ctx.onError('empty-token', start, pos);
      break;
    default:
      if (!arg) {
        const end = pos + 1;
        annotation = { type: 'junk', start: pos, end, source: source[pos] };
        junkError = new MessageSyntaxError('parse-error', start, end);
        ctx.errors.push(junkError);
      }
  }

  const attributes: CST.Attribute[] = [];
  let reqWS = Boolean(annotation || markup);
  let ws = whitespaces(source, pos);
  while (source[pos + ws] === '@') {
    if (reqWS && ws === 0) ctx.onError('missing-syntax', pos, ' ');
    pos += ws;
    const attr = parseAttribute(ctx, pos);
    attributes.push(attr);
    pos = attr.end;
    reqWS = true;
    ws = whitespaces(source, pos);
  }
  pos += ws;

  const open: CST.Syntax<'{'> = { start, end: start + 1, value: '{' };
  let close: CST.Syntax<'}'> | undefined;
  if (pos >= source.length) {
    ctx.onError('missing-syntax', pos, '}');
  } else {
    if (source[pos] !== '}') {
      const errStart = pos;
      while (pos < source.length && source[pos] !== '}') pos += 1;
      if (annotation?.type === 'junk') {
        annotation.end = pos;
        annotation.source = source.substring(annotation.start, pos);
        if (junkError) junkError.end = pos;
      } else {
        ctx.onError('extra-content', errStart, pos);
      }
    }
    if (source[pos] === '}') {
      close = { start: pos, end: pos + 1, value: '}' };
      pos += 1;
    }
  }
  const braces: CST.Expression['braces'] = close ? [open, close] : [open];
  const end = pos;
  return markup
    ? { type: 'expression', start, end, braces, markup, attributes }
    : { type: 'expression', start, end, braces, arg, annotation, attributes };
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
    if (next === '@' || next === '}') break;
    if (next === '/' && source[start] === '#') {
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
  if (type === 'function') {
    const open = { start, end: start + 1, value: ':' as const };
    return { type, start, end: pos, open, name: id.parts, options };
  } else {
    const open = { start, end: start + 1, value: source[start] as '#' | '/' };
    return { type, start, end: pos, open, name: id.parts, options, close };
  }
}

function parseOption(ctx: ParseContext, start: number): CST.Option {
  const id = parseIdentifier(ctx, start);
  let pos = id.end;
  pos += whitespaces(ctx.source, pos);
  let equals: CST.Syntax<'='> | undefined;
  if (ctx.source[pos] === '=') {
    equals = { start: pos, end: pos + 1, value: '=' };
    pos += 1;
  } else {
    ctx.onError('missing-syntax', pos, '=');
  }
  pos += whitespaces(ctx.source, pos);
  const value =
    ctx.source[pos] === '$'
      ? parseVariable(ctx, pos)
      : parseLiteral(ctx, pos, true);
  return { start, end: value.end, name: id.parts, equals, value };
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
  const open = {
    start,
    end: start + 1,
    value: ctx.source[start]
  } as CST.ReservedAnnotation['open'];
  const source = parseReservedBody(ctx, start + 1); // skip sigil
  return {
    type: 'reserved-annotation',
    start,
    end: source.end,
    open,
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
      case '@':
      case '{':
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
  while (pos > start && whitespaceChars.includes(prev)) {
    pos -= 1;
    prev = ctx.source[pos - 1];
  }
  return { start, end: pos, value: ctx.source.substring(start, pos) };
}

function parseAttribute(ctx: ParseContext, start: number): CST.Attribute {
  const { source } = ctx;
  const id = parseIdentifier(ctx, start + 1);
  let pos = id.end;
  const ws = whitespaces(source, pos);
  let equals: CST.Syntax<'='> | undefined;
  let value: CST.Literal | CST.VariableRef | undefined;
  if (source[pos + ws] === '=') {
    pos += ws + 1;
    equals = { start: pos - 1, end: pos, value: '=' };
    pos += whitespaces(source, pos);
    value =
      source[pos] === '$'
        ? parseVariable(ctx, pos)
        : parseLiteral(ctx, pos, true);
    pos = value.end;
  }
  return {
    start,
    end: pos,
    open: { start, end: start + 1, value: '@' },
    name: id.parts,
    equals,
    value
  };
}
