import { MessageSyntaxError, MissingCharError } from '../errors.js';
import type {
  LiteralParsed,
  TextParsed,
  VariableRefParsed
} from './data-model.js';
import { parseNameValue } from './names.js';

// Text ::= (TextChar | TextEscape)+
// TextChar ::= AnyChar - ('{' | '}' | Esc)
// AnyChar ::= [#x0-#x10FFFF]
// Esc ::= '\'
// TextEscape ::= Esc Esc | Esc '{' | Esc '}'
export function parseText(
  src: string,
  start: number,
  errors: MessageSyntaxError[]
): TextParsed {
  let value = '';
  let pos = start;
  let i = start;
  loop: for (; i < src.length; ++i) {
    switch (src[i]) {
      case '\\': {
        const esc = src[i + 1];
        if (esc !== '\\' && esc !== '{' && esc !== '}') {
          errors.push(new MessageSyntaxError('bad-escape', i, i + 2));
        } else {
          value += src.slice(pos, i);
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
  value += src.slice(pos, i);
  return { type: 'text', start, end: i, value };
}

// Literal ::= '(' (LiteralChar | LiteralEscape)* ')' /* ws: explicit */
// Esc ::= '\'
// LiteralChar ::= AnyChar - ('|' | Esc)
// LiteralEscape ::= Esc Esc | Esc '|'
export function parseLiteral(
  src: string,
  start: number,
  errors: MessageSyntaxError[]
): LiteralParsed {
  let value = '';
  let pos = start + 1;
  for (let i = pos; i < src.length; ++i) {
    switch (src[i]) {
      case '\\': {
        const esc = src[i + 1];
        if (esc !== '\\' && esc !== '|') {
          errors.push(new MessageSyntaxError('bad-escape', i, i + 2));
        } else {
          value += src.substring(pos, i);
          i += 1;
          pos = i;
        }
        break;
      }
      case '|':
        value += src.substring(pos, i);
        return { type: 'literal', start, end: i + 1, value };
    }
  }
  value += src.substring(pos);
  errors.push(new MissingCharError(src.length, '|'));
  return { type: 'literal', start, end: src.length, value };
}

// Variable ::= '$' Name /* ws: explicit */
export function parseVariable(
  src: string,
  start: number,
  errors: MessageSyntaxError[]
): VariableRefParsed {
  const pos = start + 1;
  const name = parseNameValue(src, pos);
  const end = pos + name.length;
  if (!name) errors.push(new MessageSyntaxError('empty-token', pos, pos + 1));
  return { type: 'variable', start, end, name };
}
