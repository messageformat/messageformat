import type * as CST from './cst-types.js';
import type { ParseContext } from './message.js';
import { parseExpression } from './expression.js';
import { whitespaces } from './util.js';
import { parseVariable } from './values.js';

export function parseDeclarations(ctx: ParseContext): {
  declarations: CST.Declaration[];
  end: number;
} {
  const { source } = ctx;
  let pos = whitespaces(source, 0);
  const declarations: CST.Declaration[] = [];
  while (pos < source.length) {
    const decl = source.startsWith('.input', pos)
      ? parseInputDeclaration(ctx, pos)
      : source.startsWith('.local', pos)
        ? parseLocalDeclaration(ctx, pos)
        : null;
    if (!decl) break;
    declarations.push(decl);
    pos = decl.end;
    pos += whitespaces(source, pos);
  }
  checkDeclarations(ctx, declarations);
  return { declarations, end: pos };
}

function parseInputDeclaration(
  ctx: ParseContext,
  start: number
): CST.Declaration {
  //
  let pos = start + 6; // '.input'
  const keyword: CST.Syntax<'.input'> = { start, end: pos, value: '.input' };
  pos += whitespaces(ctx.source, pos);

  const value = parseDeclarationValue(ctx, pos);
  if (value.type === 'expression') {
    const { body } = value;
    if (
      !(
        body.type === 'variable' ||
        (body.type === 'function' && body.operand?.type === 'variable')
      )
    ) {
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
  pos += ws;

  if (ws === 0) ctx.onError('missing-syntax', pos, ' ');

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

  pos += whitespaces(source, pos);
  let equals: CST.Syntax<'=' | ''>;
  if (source[pos] === '=') {
    equals = { start: pos, end: pos + 1, value: '=' };
    pos += 1;
  } else {
    equals = { start: pos, end: pos, value: '' };
    ctx.onError('missing-syntax', pos, '=');
  }

  pos += whitespaces(source, pos);
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
  const { source } = ctx;
  if (source[start] === '{') return parseExpression(ctx, start);

  const junkEndOffset = source.substring(start).search(/\.[a-z]|{{/);
  const end = junkEndOffset === -1 ? source.length : start + junkEndOffset;
  ctx.onError('missing-syntax', start, '{');
  return { type: 'junk', start, end, source: source.substring(start, end) };
}

/** Variables can only be declared once & declarations can't refer to later ones */
function checkDeclarations(ctx: ParseContext, declarations: CST.Declaration[]) {
  const targets = new Set<string>();
  const refs = new Map<string, CST.VariableRef[]>();
  const addRef = (ref: CST.Literal | CST.VariableRef | undefined) => {
    if (ref?.type === 'variable') {
      const prev = refs.get(ref.name);
      if (prev) prev.push(ref);
      else refs.set(ref.name, [ref]);
    }
  };

  for (const decl of declarations) {
    let target: CST.VariableRef | undefined;
    switch (decl.type) {
      case 'input':
        if (decl.value.type === 'expression') {
          const db = decl.value.body;
          switch (db.type) {
            case 'variable':
              target = db;
              break;
            case 'function':
              if (db.operand?.type === 'variable') target = db.operand;
          }
        }
        break;
      case 'local':
        if (decl.target.type === 'variable') target = decl.target;
        break;
    }
    if (target) {
      if (targets.has(target.name)) {
        ctx.onError('duplicate-declaration', target.start, target.end);
      } else {
        targets.add(target.name);
      }
      for (const { start, end } of refs.get(target.name) ?? []) {
        ctx.onError('forward-reference', start, end);
      }
    }

    if (decl.value.type === 'expression') {
      const { body } = decl.value;
      switch (body.type) {
        case 'variable':
          if (decl.type !== 'input') addRef(body);
          break;
        case 'function':
          if (decl.type !== 'input') addRef(body.operand);
          for (const opt of body.options) addRef(opt.value);
          break;
      }
    }
  }
}
