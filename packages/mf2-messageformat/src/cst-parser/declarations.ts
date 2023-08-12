import type * as CST from './cst-types.js';
import type { ParseContext } from './message.js';
import { parseExpression } from './expression.js';
import { whitespaces } from './util.js';
import { parseVariable } from './values.js';

export function parseDeclarations(ctx: ParseContext): {
  declarations: CST.Declaration[];
  end: number;
} {
  let pos = whitespaces(ctx.source, 0);
  const declarations: CST.Declaration[] = [];
  while (ctx.source.startsWith('let', pos)) {
    const decl = parseDeclaration(ctx, pos);
    declarations.push(decl);
    pos = decl.end;
    pos += whitespaces(ctx.source, pos);
  }
  checkLocalVarReferences(ctx, declarations);
  return { declarations, end: pos };
}

// declaration = let s variable [s] "=" [s] expression
// let = %x6C.65.74 ; "let"
function parseDeclaration(ctx: ParseContext, start: number): CST.Declaration {
  let pos = start + 3; // 'let'
  const ws = whitespaces(ctx.source, pos);
  pos += ws;

  if (ws === 0) ctx.onError('missing-char', pos, ' ');

  let target: CST.VariableRef | CST.Junk;
  if (ctx.source[pos] === '$') {
    target = parseVariable(ctx, pos);
    pos = target.end;
  } else {
    const junkStart = pos;
    const junkEndOffset = ctx.source.substring(pos).search(/[\t\n\r ={}]/);
    pos = junkEndOffset === -1 ? ctx.source.length : pos + junkEndOffset;
    target = {
      type: 'junk',
      start: junkStart,
      end: pos,
      source: ctx.source.substring(junkStart, pos)
    };
    ctx.onError('missing-char', junkStart, '$');
  }

  pos += whitespaces(ctx.source, pos);
  if (ctx.source[pos] === '=') pos += 1;
  else ctx.onError('missing-char', pos, '=');

  let value: CST.Expression | CST.Junk;
  pos += whitespaces(ctx.source, pos);
  if (ctx.source[pos] === '{') {
    value = parseExpression(ctx, pos);
    pos = value.end;
  } else {
    const junkStart = pos;
    const junkEndOffset = ctx.source
      .substring(pos)
      .search(/\blet|\bmatch|\bwhen|[${}]/);
    pos = junkEndOffset === -1 ? ctx.source.length : pos + junkEndOffset;
    value = {
      type: 'junk',
      start: junkStart,
      end: pos,
      source: ctx.source.substring(junkStart, pos)
    };
    ctx.onError('missing-char', junkStart, '{');
  }

  return { start, end: pos, target, value };
}

/** Local variable declarations can't refer to later ones */
function checkLocalVarReferences(
  ctx: ParseContext,
  declarations: CST.Declaration[]
) {
  const check = (name: string, ref: CST.VariableRef) => {
    if (ref.name === name) {
      ctx.onError('bad-local-var', ref.start, ref.end);
    }
  };

  for (let i = 1; i < declarations.length; ++i) {
    const { name } = declarations[i].target;
    if (!name) continue;
    for (let j = 0; j < i; ++j) {
      const { target, value } = declarations[j];
      if (target.name === name) break;
      if (value.type === 'expression') {
        const exp = value.body;
        switch (exp.type) {
          case 'function':
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
