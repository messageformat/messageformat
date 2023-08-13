import {
  MessageDataModelError,
  MessageSyntaxError,
  MissingCharError
} from '../errors.js';
import type * as CST from './cst-types.js';
import { parseDeclarations } from './declarations.js';
import { parseExpression } from './expression.js';
import { whitespaces } from './util.js';
import { parseLiteral, parseText } from './values.js';

export class ParseContext {
  readonly errors: MessageSyntaxError[] = [];
  readonly resource: boolean;
  readonly source: string;

  constructor(source: string, opt?: { resource?: boolean }) {
    this.resource = opt?.resource ?? false;
    this.source = source;
  }

  onError(
    type: Exclude<typeof MessageSyntaxError.prototype.type, 'missing-char'>,
    start: number,
    end: number
  ): void;
  onError(type: 'missing-char', start: number, char: string): void;
  onError(
    type: typeof MessageSyntaxError.prototype.type,
    start: number,
    end: number | string
  ) {
    let err: MessageSyntaxError;
    switch (type) {
      case 'key-mismatch':
      case 'missing-fallback':
        err = new MessageDataModelError(type, start, Number(end));
        break;
      case 'missing-char':
        err = new MissingCharError(start, String(end));
        break;
      default:
        err = new MessageSyntaxError(type, start, Number(end));
    }
    this.errors.push(err);
  }
}

// message = [s] *(declaration [s]) body [s]
// body = pattern / (selectors 1*([s] variant))
// selectors = match 1*([s] expression)
/**
 * Parse the string syntax representation of a message into
 * its corresponding CST representation.
 *
 * @beta
 */
export function parseMessage(
  source: string,
  opt?: { resource?: boolean }
): CST.Message {
  const ctx = new ParseContext(source, opt);
  const { declarations, end: pos } = parseDeclarations(ctx);

  if (source.startsWith('match', pos)) {
    return parseSelectMessage(ctx, pos, declarations);
  } else if (source[pos] === '{') {
    return parsePatternMessage(ctx, pos, declarations);
  } else {
    ctx.onError('parse-error', pos, source.length);
    return { type: 'junk', declarations, errors: ctx.errors, source };
  }
}

function parsePatternMessage(
  ctx: ParseContext,
  start: number,
  declarations: CST.Declaration[]
): CST.PatternMessage {
  const pattern = parsePattern(ctx, start);
  let pos = pattern.end;
  pos += whitespaces(ctx.source, pos);

  if (pos < ctx.source.length) {
    ctx.onError('extra-content', pos, ctx.source.length);
  }

  return { type: 'message', declarations, pattern, errors: ctx.errors };
}

function parseSelectMessage(
  ctx: ParseContext,
  start: number,
  declarations: CST.Declaration[]
): CST.SelectMessage {
  let pos = start + 5; // 'match'
  const match: CST.Syntax<'match'> = { start, end: pos, value: 'match' };
  pos += whitespaces(ctx.source, pos);

  const selectors: CST.Expression[] = [];
  while (ctx.source[pos] === '{') {
    const ph = parseExpression(ctx, pos);
    switch (ph.body.type) {
      case 'function':
      case 'literal':
      case 'variable':
        break;
      default: {
        const { start, end } = ph.body;
        ctx.onError('bad-selector', start, end);
      }
    }
    selectors.push(ph);
    pos = ph.end;
    pos += whitespaces(ctx.source, pos);
  }
  if (selectors.length === 0) {
    ctx.onError('empty-token', pos, pos + 1);
  }

  const variants: CST.Variant[] = [];
  pos += whitespaces(ctx.source, pos);
  while (ctx.source.startsWith('when', pos)) {
    const variant = parseVariant(ctx, pos, selectors.length);
    variants.push(variant);
    pos = variant.end;
    pos += whitespaces(ctx.source, pos);
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

// variant = when 1*(s key) [s] pattern
// key = literal / "*"
function parseVariant(
  ctx: ParseContext,
  start: number,
  selCount: number
): CST.Variant {
  let pos = start + 4; // 'when'
  const when: CST.Syntax<'when'> = { start, end: pos, value: 'when' };
  const keys: Array<CST.Literal | CST.CatchallKey> = [];
  while (pos < ctx.source.length) {
    const ws = whitespaces(ctx.source, pos);
    pos += ws;
    const ch = ctx.source[pos];
    if (ch === '{') break;

    if (ws === 0) ctx.onError('missing-char', pos, ' ');

    const key =
      ch === '*'
        ? ({ type: '*', start: pos, end: pos + 1 } satisfies CST.CatchallKey)
        : parseLiteral(ctx, pos, true);
    if (key.end === pos) break; // error; reported in pattern.errors
    keys.push(key);
    pos = key.end;
  }

  if (selCount > 0 && keys.length !== selCount) {
    const end = keys.length === 0 ? pos : keys[keys.length - 1].end;
    ctx.onError('key-mismatch', start, end);
  }

  const value = parsePattern(ctx, pos);
  return { start, end: value.end, when, keys, value };
}

// pattern = "{" *(text / expression) "}"
function parsePattern(ctx: ParseContext, start: number): CST.Pattern {
  if (ctx.source[start] !== '{') {
    ctx.onError('missing-char', start, '{');
    return { start, end: start, body: [] };
  }

  let pos = start + 1;
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

  if (ctx.source[pos] === '}') pos += 1;
  else ctx.onError('missing-char', pos, '}');

  return { start, end: pos, body };
}
