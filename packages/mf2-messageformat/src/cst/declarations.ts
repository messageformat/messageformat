import { parseExpression } from './expression.js';
import type { ParseContext } from './parse-cst.js';
import type * as CST from './types.js';
import { whitespaces } from './util.js';
import { parseVariable } from './values.js';

export function parseDeclarations(
  ctx: ParseContext,
  start: number
): {
  declarations: CST.Declaration[];
  end: number;
} {
  const { source } = ctx;
  let pos = start;
  const declarations: CST.Declaration[] = [];
  loop: while (source[pos] === '.') {
    const keyword = source.substr(pos, 6);
    let decl;
    switch (keyword) {
      case '.match':
        break loop;
      case '.input':
        decl = parseInputDeclaration(ctx, pos);
        break;
      case '.local':
        decl = parseLocalDeclaration(ctx, pos);
        break;
      default:
        decl = parseDeclarationJunk(ctx, pos);
    }
    declarations.push(decl);
    pos = whitespaces(source, decl.end).end;
  }
  return { declarations, end: pos };
}

function parseInputDeclaration(
  ctx: ParseContext,
  start: number
): CST.InputDeclaration {
  //
  let pos = start + 6; // '.input'
  const keyword: CST.Syntax<'.input'> = { start, end: pos, value: '.input' };
  pos = whitespaces(ctx.source, pos).end;

  const value = parseDeclarationValue(ctx, pos);
  if (value.type === 'expression') {
    if (value.markup || value.arg?.type !== 'variable') {
      ctx.onError('bad-input-expression', value.start, value.end);
    }
  }

  return { type: 'input', start, end: value.end, keyword, value };
}

function parseLocalDeclaration(
  ctx: ParseContext,
  start: number
): CST.LocalDeclaration {
  const { source } = ctx;

  let pos = start + 6; // '.local'
  const keyword: CST.Syntax<'.local'> = { start, end: pos, value: '.local' };
  const ws = whitespaces(source, pos);
  pos = ws.end;

  if (!ws.hasWS) ctx.onError('missing-syntax', pos, ' ');

  let target: CST.VariableRef | CST.Junk;
  if (source[pos] === '$') {
    target = parseVariable(ctx, pos);
    pos = target.end;
  } else {
    const junkStart = pos;
    const junkEndOffset = source.substring(pos).search(/[\t\n\r ={}]/);
    pos = junkEndOffset === -1 ? source.length : pos + junkEndOffset;
    target = {
      type: 'junk',
      start: junkStart,
      end: pos,
      source: source.substring(junkStart, pos)
    };
    ctx.onError('missing-syntax', junkStart, '$');
  }

  pos = whitespaces(source, pos).end;
  let equals: CST.Syntax<'='> | undefined;
  if (source[pos] === '=') {
    equals = { start: pos, end: pos + 1, value: '=' };
    pos += 1;
  } else {
    ctx.onError('missing-syntax', pos, '=');
  }

  pos = whitespaces(source, pos).end;
  const value = parseDeclarationValue(ctx, pos);

  return {
    type: 'local',
    start,
    end: value.end,
    keyword,
    target,
    equals,
    value
  };
}

function parseDeclarationValue(
  ctx: ParseContext,
  start: number
): CST.Expression | CST.Junk {
  return ctx.source[start] === '{'
    ? parseExpression(ctx, start)
    : parseDeclarationJunk(ctx, start);
}

function parseDeclarationJunk(ctx: ParseContext, start: number): CST.Junk {
  const { source } = ctx;
  const junkEndOffset = source.substring(start + 1).search(/\.[a-z]|{{/);
  let end: number;
  if (junkEndOffset === -1) {
    end = source.length;
  } else {
    end = start + 1 + junkEndOffset;
    while (/\s/.test(source[end - 1])) end -= 1;
  }
  ctx.onError('missing-syntax', start, '{');
  return { type: 'junk', start, end, source: source.substring(start, end) };
}
