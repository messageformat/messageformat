import { MessageSyntaxError } from '../errors.js';
import type {
  FunctionRefParsed,
  JunkParsed,
  LiteralParsed,
  NmtokenParsed,
  OptionParsed,
  ExpressionParsed,
  VariableRefParsed
} from './data-model.js';
import type { ParseContext } from './message.js';
import { parseNameValue, parseNmtoken } from './names.js';
import { whitespaces } from './util.js';
import { parseLiteral, parseVariable } from './values.js';

// expression = "{" [s] (((literal / variable) [s annotation]) / annotation) [s] "}"
export function parseExpression(
  ctx: ParseContext,
  start: number
): ExpressionParsed {
  let pos = start + 1; // '{'
  pos += whitespaces(ctx.source, pos);

  let arg: LiteralParsed | VariableRefParsed | undefined;
  switch (ctx.source[pos]) {
    case '|':
      arg = parseLiteral(ctx, pos);
      pos = arg.end;
      break;
    case '$': {
      arg = parseVariable(ctx, pos);
      pos = arg.end;
      break;
    }
  }

  let body: LiteralParsed | VariableRefParsed | FunctionRefParsed | JunkParsed;
  let junkError: MessageSyntaxError | undefined;
  pos += whitespaces(ctx.source, pos);
  switch (ctx.source[pos]) {
    case ':':
    case '+':
    case '-':
      body = parseFunctionRef(ctx, pos, arg);
      pos = body.end;
      break;
    default:
      if (arg) {
        body = arg;
      } else {
        const source = ctx.source.substring(pos, pos + 1);
        body = { type: 'junk', start: pos, end: pos, source };
        junkError = new MessageSyntaxError('parse-error', pos, pos + 1);
        ctx.errors.push(junkError);
      }
  }
  pos += whitespaces(ctx.source, pos);

  if (pos >= ctx.source.length) {
    ctx.onError('missing-char', pos, '}');
  } else if (ctx.source[pos] !== '}') {
    const errStart = pos;
    while (pos < ctx.source.length && ctx.source[pos] !== '}') pos += 1;
    if (body.type === 'junk') {
      body.end = pos;
      body.source = ctx.source.substring(body.start, pos);
      if (junkError) junkError.end = pos;
    } else {
      ctx.onError('extra-content', errStart, pos);
    }
  } else {
    pos += 1;
  }

  return { type: 'expression', start, end: pos, body };
}

// annotation = function *(s option)
// function = (":" / "+" / "-") name
function parseFunctionRef(
  ctx: ParseContext,
  start: number,
  operand: LiteralParsed | VariableRefParsed | undefined
): FunctionRefParsed {
  const sigil = ctx.source[start];
  let pos = start + 1; // ':' | '+' | '-'
  const name = parseNameValue(ctx.source, pos);
  if (!name) ctx.onError('empty-token', pos, pos + 1);
  const options: OptionParsed[] = [];
  pos += name.length;
  while (pos < ctx.source.length) {
    const ws = whitespaces(ctx.source, pos);
    if (ctx.source[pos + ws] === '}') break;
    if (ws === 0) ctx.onError('missing-char', pos, ' ');
    pos += ws;
    const opt = parseOption(ctx, pos);
    if (opt.end === pos) break; // error
    options.push(opt);
    pos = opt.end;
  }
  const kind = sigil === '+' ? 'open' : sigil === '-' ? 'close' : 'value';
  return { type: 'function', kind, operand, start, end: pos, name, options };
}

// option = name [s] "=" [s] (literal / nmtoken / variable)
function parseOption(ctx: ParseContext, start: number): OptionParsed {
  const name = parseNameValue(ctx.source, start);
  let pos = start + name.length;
  pos += whitespaces(ctx.source, pos);
  if (ctx.source[pos] === '=') pos += 1;
  else ctx.onError('missing-char', pos, '=');
  pos += whitespaces(ctx.source, pos);
  let value: LiteralParsed | NmtokenParsed | VariableRefParsed;
  switch (ctx.source[pos]) {
    case '|':
      value = parseLiteral(ctx, pos);
      break;
    case '$':
      value = parseVariable(ctx, pos);
      break;
    default:
      value = parseNmtoken(ctx, pos);
  }
  return { start, end: value.end, name, value };
}
