import { MessageDataModelError, MessageSyntaxError } from '../errors.js';
import { parseDeclarations } from './declarations.js';
import { parseExpression } from './expression.js';
import type * as CST from './types.js';
import { whitespaces } from './util.js';
import { parseLiteral, parseText, parseVariable } from './values.js';

export class ParseContext {
  readonly errors: MessageSyntaxError[] = [];
  readonly resource: boolean;
  readonly source: string;

  constructor(source: string, opt?: { resource?: boolean }) {
    this.resource = opt?.resource ?? false;
    this.source = source;
  }

  onError(
    type: Exclude<
      typeof MessageSyntaxError.prototype.type,
      'missing-syntax' | typeof MessageDataModelError.prototype.type
    >,
    start: number,
    end: number
  ): void;
  onError(type: 'missing-syntax', start: number, char: string): void;
  onError(
    type: typeof MessageSyntaxError.prototype.type,
    start: number,
    end: number | string
  ) {
    let err: MessageSyntaxError;
    if (type === 'missing-syntax') {
      const exp = String(end);
      err = new MessageSyntaxError(type, start, start + exp.length, exp);
    } else {
      err = new MessageSyntaxError(type, start, Number(end));
    }
    this.errors.push(err);
  }
}

/**
 * Parse the string syntax representation of a message into
 * its corresponding CST representation.
 *
 * @beta
 */
export function parseCST(
  source: string,
  opt?: { resource?: boolean }
): CST.Message {
  const ctx = new ParseContext(source, opt);

  const pos = whitespaces(source, 0).end;
  if (source.startsWith('.', pos)) {
    const { declarations, end } = parseDeclarations(ctx, pos);
    return source.startsWith('.match', end)
      ? parseSelectMessage(ctx, end, declarations)
      : parsePatternMessage(ctx, end, declarations, true);
  } else {
    return source.startsWith('{{', pos)
      ? parsePatternMessage(ctx, pos, [], true)
      : parsePatternMessage(ctx, 0, [], false);
  }
}

function parsePatternMessage(
  ctx: ParseContext,
  start: number,
  declarations: CST.Declaration[],
  complex: boolean
): CST.SimpleMessage | CST.ComplexMessage {
  const pattern = parsePattern(ctx, start, complex);
  const pos = whitespaces(ctx.source, pattern.end).end;

  if (pos < ctx.source.length) {
    ctx.onError('extra-content', pos, ctx.source.length);
  }

  return complex
    ? { type: 'complex', declarations, pattern, errors: ctx.errors }
    : { type: 'simple', pattern, errors: ctx.errors };
}

function parseSelectMessage(
  ctx: ParseContext,
  start: number,
  declarations: CST.Declaration[]
): CST.SelectMessage {
  let pos = start + 6; // '.match'
  const match: CST.Syntax<'.match'> = { start, end: pos, value: '.match' };
  let ws = whitespaces(ctx.source, pos);
  if (!ws.hasWS) ctx.onError('missing-syntax', pos, "' '");
  pos = ws.end;

  const selectors: CST.VariableRef[] = [];
  while (ctx.source[pos] === '$') {
    const sel = parseVariable(ctx, pos);
    selectors.push(sel);
    pos = sel.end;
    ws = whitespaces(ctx.source, pos);
    if (!ws.hasWS) ctx.onError('missing-syntax', pos, "' '");
    pos = ws.end;
  }
  if (selectors.length === 0) ctx.onError('empty-token', pos, pos + 1);

  const variants: CST.Variant[] = [];
  while (pos < ctx.source.length) {
    const variant = parseVariant(ctx, pos);
    if (variant.end > pos) {
      variants.push(variant);
      pos = variant.end;
    } else {
      pos += 1;
    }
    pos = whitespaces(ctx.source, pos).end;
  }

  if (pos < ctx.source.length) {
    ctx.onError('extra-content', pos, ctx.source.length);
  }

  return {
    type: 'select',
    declarations,
    match,
    selectors,
    variants,
    errors: ctx.errors
  };
}

function parseVariant(ctx: ParseContext, start: number): CST.Variant {
  let pos = start;
  const keys: Array<CST.Literal | CST.CatchallKey> = [];
  while (pos < ctx.source.length) {
    const ws = whitespaces(ctx.source, pos);
    pos = ws.end;
    const ch = ctx.source[pos];
    if (ch === '{') break;

    if (pos > start && !ws.hasWS) ctx.onError('missing-syntax', pos, "' '");

    const key =
      ch === '*'
        ? ({ type: '*', start: pos, end: pos + 1 } satisfies CST.CatchallKey)
        : parseLiteral(ctx, pos, true);
    if (key.end === pos) break; // error; reported in pattern.errors
    keys.push(key);
    pos = key.end;
  }

  const value = parsePattern(ctx, pos, true);
  return { start, end: value.end, keys, value };
}

function parsePattern(
  ctx: ParseContext,
  start: number,
  quoted: boolean
): CST.Pattern {
  let pos = start;
  if (quoted) {
    if (ctx.source.startsWith('{{', pos)) {
      pos += 2;
    } else {
      ctx.onError('missing-syntax', start, '{{');
      return { start, end: start, body: [] };
    }
  }

  const body: Array<CST.Text | CST.Expression> = [];
  loop: while (pos < ctx.source.length) {
    switch (ctx.source[pos]) {
      case '{': {
        const ph = parseExpression(ctx, pos);
        body.push(ph);
        pos = ph.end;
        break;
      }
      case '}':
        break loop;
      default: {
        const tx = parseText(ctx, pos);
        body.push(tx);
        pos = tx.end;
      }
    }
  }

  if (quoted) {
    const q0: CST.Syntax<'{{'> = { start, end: start + 2, value: '{{' };
    let braces: CST.Pattern['braces'];
    if (ctx.source.startsWith('}}', pos)) {
      braces = [q0, { start: pos, end: pos + 2, value: '}}' }];
      pos += 2;
    } else {
      braces = [q0];
      ctx.onError('missing-syntax', pos, '}}');
    }
    return { braces, start, end: pos, body };
  }

  return { start, end: pos, body };
}
