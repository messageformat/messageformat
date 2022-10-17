import type {
  DeclarationParsed,
  JunkParsed,
  PlaceholderParsed,
  ParseError,
  VariableRefParsed
} from './data-model.js';
import { parsePlaceholder } from './placeholder.js';
import { whitespaces } from './util.js';
import { parseVariable } from './values.js';

// Declaration ::= 'let' WhiteSpace Variable '=' '{' Expression '}'
export function parseDeclarations(
  src: string,
  errors: ParseError[]
): {
  declarations: DeclarationParsed[];
  end: number;
} {
  let pos = whitespaces(src, 0);
  const declarations: DeclarationParsed[] = [];
  while (src.startsWith('let', pos)) {
    const decl = parseDeclaration(src, pos, errors);
    declarations.push(decl);
    pos = decl.end;
    pos += whitespaces(src, pos);
  }
  checkLocalVarReferences(declarations, errors);
  return { declarations, end: pos };
}

function parseDeclaration(
  src: string,
  start: number,
  errors: ParseError[]
): DeclarationParsed {
  let pos = start + 3; // 'let'
  const ws = whitespaces(src, pos);
  pos += ws;

  if (ws === 0) errors.push({ type: 'missing-char', char: ' ', start: pos });

  let target: VariableRefParsed | JunkParsed;
  if (src[pos] === '$') {
    target = parseVariable(src, pos, errors);
    pos = target.end;
  } else {
    const junkStart = pos;
    const junkEndOffset = src.substring(pos).search(/[\t\n\r ={}]/);
    pos = junkEndOffset === -1 ? src.length : pos + junkEndOffset;
    target = {
      type: 'junk',
      start: junkStart,
      end: pos,
      source: src.substring(junkStart, pos)
    };
    errors.push({ type: 'missing-char', char: '$', start: junkStart });
  }

  pos += whitespaces(src, pos);
  if (src[pos] === '=') pos += 1;
  else errors.push({ type: 'missing-char', char: '=', start: pos });

  let value: PlaceholderParsed | JunkParsed;
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
    value = {
      type: 'junk',
      start: junkStart,
      end: pos,
      source: src.substring(junkStart, pos)
    };
    errors.push({ type: 'missing-char', char: '{', start: junkStart });
  }

  return { start, end: pos, target, value };
}

/** Local variable declarations can't refer to later ones */
function checkLocalVarReferences(
  declarations: DeclarationParsed[],
  errors: ParseError[]
) {
  const check = (name: string, ref: VariableRefParsed) => {
    if (ref.name === name)
      errors.push({ type: 'bad-local-var', start: ref.start, end: ref.end });
  };

  for (let i = 1; i < declarations.length; ++i) {
    const { name } = declarations[i].target;
    if (!name) continue;
    for (let j = 0; j < i; ++j) {
      const ph = declarations[j].value;
      if (ph.type === 'placeholder') {
        const exp = ph.body;
        switch (exp.type) {
          case 'expression':
            if (exp.operand?.type === 'variable') check(name, exp.operand);
            for (const opt of exp.options) {
              if (opt.value.type === 'variable') check(name, opt.value);
            }
            break;
          case 'variable':
            check(name, exp);
            break;
        }
      }
    }
  }
}
