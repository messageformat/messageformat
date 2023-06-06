import type {
  LiteralParsed,
  TextParsed,
  VariableRefParsed
} from './data-model.js';
import type { ParseContext } from './message.js';
import { parseNameValue, parseUnquotedLiteralValue } from './names.js';

// Text ::= (TextChar | TextEscape)+
// TextChar ::= AnyChar - ('{' | '}' | Esc)
// AnyChar ::= [#x0-#x10FFFF]
// Esc ::= '\'
// TextEscape ::= Esc Esc | Esc '{' | Esc '}'
export function parseText(ctx: ParseContext, start: number): TextParsed {
  let value = '';
  let pos = start;
  let i = start;
  loop: for (; i < ctx.source.length; ++i) {
    switch (ctx.source[i]) {
      case '\\': {
        const esc = ctx.source[i + 1];
        if (esc !== '\\' && esc !== '{' && esc !== '}') {
          ctx.onError('bad-escape', i, i + 2);
        } else {
          value += ctx.source.slice(pos, i);
          i += 1;
          pos = i;
        }
        break;
      }
      case '{':
      case '}':
        break loop;
    }
  }
  value += ctx.source.slice(pos, i);
  return { type: 'text', start, end: i, value };
}

export function parseLiteral(
  ctx: ParseContext,
  start: number,
  required: true
): LiteralParsed;
export function parseLiteral(
  ctx: ParseContext,
  start: number,
  required: boolean
): LiteralParsed | undefined;
export function parseLiteral(
  ctx: ParseContext,
  start: number,
  required: boolean
): LiteralParsed | undefined {
  if (ctx.source[start] === '|') return parseQuotedLiteral(ctx, start);
  const value = parseUnquotedLiteralValue(ctx, start);
  if (!value) {
    if (required) ctx.onError('empty-token', start, start);
    else return undefined;
  }
  const end = start + value.length;
  return { type: 'literal', quoted: false, start, end, value };
}

// quoted      = "|" *(quoted-char / quoted-escape) "|"
// quoted-char = %x0-5B         ; omit \
//             / %x5D-7B        ; omit |
//             / %x7D-D7FF      ; omit surrogates
//             / %xE000-10FFFF
// quoted-escape   = backslash ( backslash / "|" )
// backslash       = %x5C ; U+005C REVERSE SOLIDUS "\"
export function parseQuotedLiteral(
  ctx: ParseContext,
  start: number
): LiteralParsed {
  let value = '';
  let pos = start + 1;
  for (let i = pos; i < ctx.source.length; ++i) {
    switch (ctx.source[i]) {
      case '\\': {
        const esc = ctx.source[i + 1];
        if (esc !== '\\' && esc !== '|') {
          ctx.onError('bad-escape', i, i + 2);
        } else {
          value += ctx.source.substring(pos, i);
          i += 1;
          pos = i;
        }
        break;
      }
      case '|':
        value += ctx.source.substring(pos, i);
        return { type: 'literal', quoted: true, start, end: i + 1, value };
    }
  }
  value += ctx.source.substring(pos);
  ctx.onError('missing-char', ctx.source.length, '|');
  return {
    type: 'literal',
    quoted: true,
    start,
    end: ctx.source.length,
    value
  };
}

// Variable ::= '$' Name /* ws: explicit */
export function parseVariable(
  ctx: ParseContext,
  start: number
): VariableRefParsed {
  const pos = start + 1;
  const name = parseNameValue(ctx.source, pos);
  const end = pos + name.length;
  if (!name) ctx.onError('empty-token', pos, pos + 1);
  return { type: 'variable', start, end, name };
}
