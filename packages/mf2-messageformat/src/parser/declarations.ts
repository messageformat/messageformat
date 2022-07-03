import type {
  Declaration,
  Junk,
  Placeholder,
  TokenError,
  Variable
} from './data-model.js';
import { parsePlaceholder } from './placeholder.js';
import { whitespaces } from './util.js';
import { parseVariable } from './values.js';

// Declaration ::= 'let' WhiteSpace Variable '=' '{' Expression '}'
export function parseDeclarations(
  src: string,
  errors: TokenError[]
): {
  declarations: Declaration[];
  end: number;
} {
  let pos = whitespaces(src, 0);
  const declarations: Declaration[] = [];
  while (src.startsWith('let', pos)) {
    const decl = parseDeclaration(src, pos, errors);
    declarations.push(decl);
    pos = decl.end;
    pos += whitespaces(src, pos);
  }
  return { declarations, end: pos };
}

function parseDeclaration(
  src: string,
  start: number,
  errors: TokenError[]
): Declaration {
  let pos = start + 3; // 'let'
  const ws = whitespaces(src, pos);
  pos += ws;

  if (ws === 0) errors.push({ type: 'missing-char', char: ' ', start: pos });

  let target: Variable | Junk;
  if (src[pos] === '$') {
    target = parseVariable(src, pos, errors);
    pos = target.end;
  } else {
    const junkStart = pos;
    const junkEndOffset = src.substring(pos).search(/[\t\n\r ={}]/);
    pos = junkEndOffset === -1 ? src.length : pos + junkEndOffset;
    target = { type: 'junk', start: junkStart, end: pos };
    errors.push({ type: 'parse-error', start: junkStart, end: pos });
  }

  pos += whitespaces(src, pos);
  if (src[pos] === '=') pos += 1;
  else errors.push({ type: 'missing-char', char: '=', start: pos });

  let value: Placeholder | Junk;
  pos += whitespaces(src, pos);
  if (src[pos] === '{') {
    value = parsePlaceholder(src, pos, errors);
    pos = value.end;
  } else {
    const junkStart = pos;
    const junkEndOffset = src
      .substring(pos)
      .search(/\blet|\bmatch|\bwhen|[${}]/);
    pos = junkEndOffset === -1 ? src.length : pos + junkEndOffset;
    value = { type: 'junk', start: junkStart, end: pos };
    errors.push({ type: 'parse-error', start: junkStart, end: pos });
  }

  return { start, end: pos, target, value };
}
