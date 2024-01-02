import { isValidUnquotedLiteral } from '../cst-parser/names.js';
import {
  isLiteral,
  isPatternMessage,
  isSelectMessage,
  isVariableRef
} from '../data-model/type-guards.js';
import type {
  Declaration,
  Expression,
  FunctionAnnotation,
  Literal,
  Markup,
  Message,
  Option,
  Pattern,
  UnsupportedAnnotation,
  VariableRef
} from '../data-model/types.js';
import { MessageFormat } from '../messageformat.js';

/**
 * Stringify a message using its syntax representation.
 *
 * @beta
 */
export function stringifyMessage(msg: Message | MessageFormat) {
  if (msg instanceof MessageFormat) msg = msg.resolvedOptions().message;
  let res = '';
  for (const decl of msg.declarations) res += stringifyDeclaration(decl);
  if (isPatternMessage(msg)) {
    res += stringifyPattern(msg.pattern, !!res);
  } else if (isSelectMessage(msg)) {
    res += '.match';
    for (const sel of msg.selectors) res += ' ' + stringifyExpression(sel);
    for (const { keys, value } of msg.variants) {
      res += '\n';
      for (const key of keys) {
        res += (isLiteral(key) ? stringifyLiteral(key) : '*') + ' ';
      }
      res += stringifyPattern(value, true);
    }
  }
  return res;
}

function stringifyDeclaration(decl: Declaration) {
  switch (decl.type) {
    case 'input':
      return `.input ${stringifyExpression(decl.value)}\n`;
    case 'local':
      return `.local $${decl.name} = ${stringifyExpression(decl.value)}\n`;
    case 'unsupported-statement': {
      const parts = [`.${decl.keyword}`];
      if (decl.body) parts.push(decl.body);
      for (const exp of decl.expressions) {
        parts.push(
          exp.type === 'expression'
            ? stringifyExpression(exp)
            : stringifyMarkup(exp)
        );
      }
      return parts.join(' ');
    }
  }
  // @ts-expect-error Guard against non-TS users with bad data
  throw new Error(`Unsupported ${decl.type} declaration`);
}

function stringifyFunctionAnnotation({ name, options }: FunctionAnnotation) {
  let res = `:${name}`;
  if (options) for (const opt of options) res += ' ' + stringifyOption(opt);
  return res;
}

function stringifyMarkup({ kind, name, options }: Markup) {
  if (kind === 'close') return `{/${name}}`;
  let res = `{#${name}`;
  if (options) for (const opt of options) res += ' ' + stringifyOption(opt);
  res += kind === 'standalone' ? ' /}' : '}';
  return res;
}

function stringifyLiteral({ value }: Literal) {
  if (isValidUnquotedLiteral(value)) return value;
  const esc = value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
  return `|${esc}|`;
}

function stringifyOption({ name, value }: Option) {
  const valueStr = isVariableRef(value)
    ? stringifyVariableRef(value)
    : stringifyLiteral(value);
  return `${name}=${valueStr}`;
}

function stringifyPattern({ body }: Pattern, quoted: boolean) {
  let res = '';
  if (!quoted && typeof body[0] === 'string' && body[0][0] === '.') {
    quoted = true;
  }
  for (const el of body) {
    if (typeof el === 'string') res += el;
    else if (el.type === 'markup') res += stringifyMarkup(el);
    else res += stringifyExpression(el);
  }
  return quoted ? `{{${res}}}` : res;
}

function stringifyExpression({ arg, annotation }: Expression) {
  let res: string;
  switch (arg?.type) {
    case 'literal':
      res = stringifyLiteral(arg);
      break;
    case 'variable':
      res = stringifyVariableRef(arg);
      break;
    default:
      res = '';
  }
  if (annotation) {
    if (res) res += ' ';
    res +=
      annotation.type === 'function'
        ? stringifyFunctionAnnotation(annotation)
        : stringifyUnsupportedAnnotation(annotation);
  }
  return `{${res}}`;
}

function stringifyUnsupportedAnnotation({
  sigil,
  source = '�'
}: UnsupportedAnnotation) {
  return (sigil ?? '�') + source;
}

function stringifyVariableRef(ref: VariableRef) {
  return '$' + ref.name;
}
