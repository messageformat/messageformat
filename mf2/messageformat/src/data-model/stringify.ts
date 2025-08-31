import { isValidUnquotedLiteral } from '../cst/names.ts';
import {
  isLiteral,
  isPatternMessage,
  isSelectMessage,
  isVariableRef
} from './type-guards.ts';
import type {
  Declaration,
  Expression,
  FunctionRef,
  Literal,
  Markup,
  Message,
  Pattern,
  VariableRef
} from './types.ts';

/**
 * Stringify a {@link Message} using its syntax representation.
 * Parsing and stringifying a message will not necessarily produce
 * exactly the same syntax representation.
 *
 * @category Message Data Model
 */
export function stringifyMessage(msg: Message) {
  let res = '';
  for (const decl of msg.declarations) res += stringifyDeclaration(decl);
  if (isPatternMessage(msg)) {
    res += stringifyPattern(msg.pattern, !!res);
  } else if (isSelectMessage(msg)) {
    res += '.match';
    for (const sel of msg.selectors) res += ' ' + stringifyVariableRef(sel);
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
  }
  // @ts-expect-error Guard against non-TS users with bad data
  throw new Error(`Unsupported ${decl.type} declaration`);
}

function stringifyFunctionRef({ name, options }: FunctionRef) {
  let res = `:${name}`;
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      res += ' ' + stringifyOption(key, value);
    }
  }
  return res;
}

function stringifyMarkup({ kind, name, options, attributes }: Markup) {
  let res = kind === 'close' ? '{/' : '{#';
  res += name;
  if (options) {
    for (const [name, value] of Object.entries(options)) {
      res += ' ' + stringifyOption(name, value);
    }
  }
  if (attributes) {
    for (const [name, value] of Object.entries(attributes)) {
      res += ' ' + stringifyAttribute(name, value);
    }
  }
  res += kind === 'standalone' ? ' /}' : '}';
  return res;
}

function stringifyLiteral({ value }: Literal) {
  if (isValidUnquotedLiteral(value)) return value;
  const esc = value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
  return `|${esc}|`;
}

function stringifyOption(name: string, value: Literal | VariableRef) {
  const valueStr = isVariableRef(value)
    ? stringifyVariableRef(value)
    : stringifyLiteral(value);
  return `${name}=${valueStr}`;
}

function stringifyAttribute(name: string, value: true | Literal) {
  return value === true ? `@${name}` : `@${name}=${stringifyLiteral(value)}`;
}

function stringifyPattern(pattern: Pattern, quoted: boolean) {
  let res = '';
  if (!quoted && typeof pattern[0] === 'string' && /^\s*\./.test(pattern[0])) {
    quoted = true;
  }
  for (const el of pattern) {
    if (typeof el === 'string') res += el.replace(/[\\{}]/g, '\\$&');
    else if (el.type === 'markup') res += stringifyMarkup(el);
    else res += stringifyExpression(el);
  }
  return quoted ? `{{${res}}}` : res;
}

function stringifyExpression({ arg, attributes, functionRef }: Expression) {
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
  if (functionRef) {
    if (res) res += ' ';
    res += stringifyFunctionRef(functionRef);
  }
  if (attributes) {
    for (const [name, value] of Object.entries(attributes)) {
      res += ' ' + stringifyAttribute(name, value);
    }
  }
  return `{${res}}`;
}

function stringifyVariableRef(ref: VariableRef) {
  return '$' + ref.name;
}
