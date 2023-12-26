import { isValidUnquotedLiteral } from '../cst-parser/index.js';
import {
  Declaration,
  isPatternMessage,
  isSelectMessage,
  Message,
  Pattern
} from '../data-model';
import {
  Expression,
  FunctionAnnotation,
  functionAnnotationSource,
  isLiteral,
  isVariableRef,
  Literal,
  Option,
  UnsupportedAnnotation,
  VariableRef
} from '../expression/index.js';
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
    res += stringifyPattern(msg.pattern);
  } else if (isSelectMessage(msg)) {
    res += 'match';
    for (const sel of msg.selectors) res += ' ' + stringifyExpression(sel);
    for (const { keys, value } of msg.variants) {
      res += '\nwhen ';
      for (const key of keys) {
        res += (isLiteral(key) ? stringifyLiteral(key) : '*') + ' ';
      }
      res += stringifyPattern(value);
    }
  }
  return res;
}

function stringifyDeclaration({ name, value }: Declaration) {
  return `let $${name} = ${stringifyExpression(value)}\n`;
}

function stringifyFunctionAnnotation({
  kind,
  name,
  options
}: FunctionAnnotation) {
  let res = functionAnnotationSource(kind, name);
  if (options) for (const opt of options) res += ' ' + stringifyOption(opt);
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

function stringifyPattern({ body }: Pattern) {
  let res = '';
  for (const el of body) {
    res += typeof el === 'string' ? el : stringifyExpression(el);
  }
  return `{${res}}`;
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
