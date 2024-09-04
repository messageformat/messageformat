import { parseNameValue, parseUnquotedLiteralValue } from './names.js';
import type { ParseContext } from './parse-cst.js';
import type * as CST from './types.js';

// Text ::= (TextChar | TextEscape)+
// TextChar ::= AnyChar - ('{' | '}' | Esc)
// AnyChar ::= [#x0-#x10FFFF]
// Esc ::= '\'
// TextEscape ::= Esc Esc | Esc '{' | Esc '}'
export function parseText(ctx: ParseContext, start: number): CST.Text {
  let value = '';
  let pos = start;
  let i = start;
  loop: for (; i < ctx.source.length; ++i) {
    switch (ctx.source[i]) {
      case '\\': {
        const esc = parseEscape(ctx, i);
        if (esc) {
          value += ctx.source.substring(pos, i) + esc.value;
          i += esc.length;
          pos = i + 1;
        }
        break;
      }
      case '{':
      case '}':
        break loop;
      case '\n':
        if (ctx.resource) {
          const nl = i;
          let next = ctx.source[i + 1];
          while (next === ' ' || next === '\t') {
            i += 1;
            next = ctx.source[i + 1];
          }
          if (i > nl) {
            value += ctx.source.substring(pos, nl + 1);
            pos = i + 1;
          }
        }
        break;
    }
  }
  value += ctx.source.substring(pos, i);
  return { type: 'text', start, end: i, value };
}

export function parseLiteral(
  ctx: ParseContext,
  start: number,
  required: true
): CST.Literal;
export function parseLiteral(
  ctx: ParseContext,
  start: number,
  required: boolean
): CST.Literal | undefined;
export function parseLiteral(
  ctx: ParseContext,
  start: number,
  required: boolean
): CST.Literal | undefined {
  if (ctx.source[start] === '|') return parseQuotedLiteral(ctx, start);
  const value = parseUnquotedLiteralValue(ctx.source, start);
  if (!value) {
    if (required) ctx.onError('empty-token', start, start);
    else return undefined;
  }
  const end = start + value.length;
  return { type: 'literal', quoted: false, start, end, value };
}

export function parseQuotedLiteral(
  ctx: ParseContext,
  start: number
): CST.Literal {
  let value = '';
  let pos = start + 1;
  const open = { start, end: pos, value: '|' as const };
  for (let i = pos; i < ctx.source.length; ++i) {
    switch (ctx.source[i]) {
      case '\\': {
        const esc = parseEscape(ctx, i);
        if (esc) {
          value += ctx.source.substring(pos, i) + esc.value;
          i += esc.length;
          pos = i + 1;
        }
        break;
      }
      case '|':
        value += ctx.source.substring(pos, i);
        return {
          type: 'literal',
          quoted: true,
          start,
          end: i + 1,
          open,
          value,
          close: { start: i, end: i + 1, value: '|' }
        };
      case '\n':
        if (ctx.resource) {
          const nl = i;
          let next = ctx.source[i + 1];
          while (next === ' ' || next === '\t') {
            i += 1;
            next = ctx.source[i + 1];
          }
          if (i > nl) {
            value += ctx.source.substring(pos, nl + 1);
            pos = i + 1;
          }
        }
        break;
    }
  }
  value += ctx.source.substring(pos);
  ctx.onError('missing-syntax', ctx.source.length, '|');
  return {
    type: 'literal',
    quoted: true,
    start,
    end: ctx.source.length,
    open,
    value,
    close: undefined
  };
}

export function parseVariable(
  ctx: ParseContext,
  start: number
): CST.VariableRef {
  const pos = start + 1;
  const open = { start, end: pos, value: '$' as const };
  const name = parseNameValue(ctx.source, pos);
  const end = pos + name.length;
  if (!name) ctx.onError('empty-token', pos, pos + 1);
  return { type: 'variable', start, end, open, name };
}

function parseEscape(
  ctx: ParseContext,
  start: number
): { value: string; length: number } | null {
  const raw = ctx.source[start + 1];
  if ('\\{|}'.includes(raw)) return { value: raw, length: 1 };
  if (ctx.resource) {
    let hexLen = 0;
    switch (raw) {
      case '\t':
      case ' ':
        return { value: raw, length: 1 };
      case 'n':
        return { value: '\n', length: 1 };
      case 'r':
        return { value: '\r', length: 1 };
      case 't':
        return { value: '\t', length: 1 };
      case 'u':
        hexLen = 4;
        break;
      case 'U':
        hexLen = 6;
        break;
      case 'x':
        hexLen = 2;
        break;
    }
    if (hexLen > 0) {
      const h0 = start + 2;
      const raw = ctx.source.substring(h0, h0 + hexLen);
      if (raw.length === hexLen && /^[0-9A-Fa-f]+$/.test(raw)) {
        return {
          value: String.fromCharCode(parseInt(raw, 16)),
          length: 1 + hexLen
        };
      }
    }
  }
  ctx.onError('bad-escape', start, start + 2);
  return null;
}
