import { MessageSyntaxError } from '../errors.ts';
import { parseNameValue } from './names.ts';
import type { ParseContext } from './parse-cst.ts';
import type * as CST from './types.ts';
import { whitespaces } from './util.ts';
import { parseLiteral, parseVariable } from './values.ts';

export function parseExpression(
  ctx: ParseContext,
  start: number
): CST.Expression {
  const { source } = ctx;
  let pos = start + 1; // '{'
  pos = whitespaces(source, pos).end;

  const arg =
    source[pos] === '$'
      ? parseVariable(ctx, pos)
      : parseLiteral(ctx, pos, false);
  if (arg) {
    pos = arg.end;
    const ws = whitespaces(source, pos);
    if (!ws.hasWS && source[pos] !== '}') {
      ctx.onError('missing-syntax', pos, ' ');
    }
    pos = ws.end;
  }

  let functionRef: CST.FunctionRef | CST.Junk | undefined;
  let markup: CST.Markup | undefined;
  let junkError: MessageSyntaxError | undefined;
  switch (source[pos]) {
    case ':':
      functionRef = parseFunctionRefOrMarkup(ctx, pos, 'function');
      pos = functionRef.end;
      break;
    case '#':
    case '/':
      if (arg) ctx.onError('extra-content', arg.start, arg.end);
      markup = parseFunctionRefOrMarkup(ctx, pos, 'markup');
      pos = markup.end;
      break;
    case '@':
    case '}':
      if (!arg) ctx.onError('empty-token', start, pos);
      break;
    default:
      if (!arg) {
        const end = pos + 1;
        functionRef = { type: 'junk', start: pos, end, source: source[pos] };
        junkError = new MessageSyntaxError('parse-error', start, end);
        ctx.errors.push(junkError);
      }
  }

  const attributes: CST.Attribute[] = [];
  let reqWS = Boolean(functionRef || markup);
  let ws = whitespaces(source, pos);
  while (source[ws.end] === '@') {
    if (reqWS && !ws.hasWS) ctx.onError('missing-syntax', pos, ' ');
    pos = ws.end;
    const attr = parseAttribute(ctx, pos);
    attributes.push(attr);
    pos = attr.end;
    reqWS = true;
    ws = whitespaces(source, pos);
  }
  pos = ws.end;

  const open: CST.Syntax<'{'> = { start, end: start + 1, value: '{' };
  let close: CST.Syntax<'}'> | undefined;
  if (pos >= source.length) {
    ctx.onError('missing-syntax', pos, '}');
  } else {
    if (source[pos] !== '}') {
      const errStart = pos;
      while (pos < source.length && source[pos] !== '}') pos += 1;
      if (functionRef?.type === 'junk') {
        functionRef.end = pos;
        functionRef.source = source.substring(functionRef.start, pos);
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
    : {
        type: 'expression',
        start,
        end,
        braces,
        arg,
        functionRef,
        attributes
      };
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
    const next = source[ws.end];
    if (next === '@' || next === '}') break;
    if (next === '/' && source[start] === '#') {
      pos = ws.end + 1;
      close = { start: pos - 1, end: pos, value: '/' };
      ws = whitespaces(source, pos);
      if (ws.hasWS) ctx.onError('extra-content', pos, ws.end);
      break;
    }
    if (!ws.hasWS) ctx.onError('missing-syntax', pos, ' ');
    pos = ws.end;
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
  let pos = whitespaces(ctx.source, id.end).end;
  let equals: CST.Syntax<'='> | undefined;
  if (ctx.source[pos] === '=') {
    equals = { start: pos, end: pos + 1, value: '=' };
    pos += 1;
  } else {
    ctx.onError('missing-syntax', pos, '=');
  }
  pos = whitespaces(ctx.source, pos).end;
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
  const name0 = parseNameValue(source, start);
  if (!name0) {
    ctx.onError('empty-token', start, start + 1);
    return { parts: [{ start, end: start, value: '' }], end: start };
  }
  let pos = name0.end;
  const id0 = { start, end: pos, value: name0.value };
  if (source[pos] !== ':') return { parts: [id0], end: pos };

  const sep = { start: pos, end: pos + 1, value: ':' as const };
  pos += 1;

  const name1 = parseNameValue(source, pos);
  if (name1) {
    const id1 = { start: pos, end: name1.end, value: name1.value };
    return { parts: [id0, sep, id1], end: name1.end };
  } else {
    ctx.onError('empty-token', pos, pos + 1);
    return { parts: [id0, sep], end: pos };
  }
}

function parseAttribute(ctx: ParseContext, start: number): CST.Attribute {
  const { source } = ctx;
  const id = parseIdentifier(ctx, start + 1);
  let pos = id.end;
  const ws = whitespaces(source, pos);
  let equals: CST.Syntax<'='> | undefined;
  let value: CST.Literal | undefined;
  if (source[ws.end] === '=') {
    pos = ws.end + 1;
    equals = { start: pos - 1, end: pos, value: '=' };
    pos = whitespaces(source, pos).end;
    value = parseLiteral(ctx, pos, true);
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
