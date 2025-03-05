import type * as CST from './types.ts';

/**
 * Stringify a message CST.
 * Does not perform any error checking or validation.
 */
export function stringifyCST(cst: CST.Message): string {
  let str = '';

  if (cst.declarations) {
    for (const decl of cst.declarations) {
      switch (decl.type) {
        case 'input': {
          const kw = decl.keyword.value;
          const val = stringifyExpression(decl.value);
          str += `${kw} ${val}\n`;
          break;
        }
        case 'local': {
          const kw = decl.keyword.value;
          const tgt = stringifyValue(decl.target);
          const eq = decl.equals?.value ?? '=';
          const val = stringifyExpression(decl.value);
          str += `${kw} ${tgt} ${eq} ${val}\n`;
          break;
        }
        case 'junk':
          str += decl.source + '\n';
          break;
      }
    }
  }

  if (cst.type === 'select') {
    str += cst.match.value;
    for (const sel of cst.selectors) str += ' ' + stringifyValue(sel);
    for (const { keys, value } of cst.variants) {
      str += '\n';
      for (const key of keys) str += stringifyValue(key) + ' ';
      str += stringifyPattern(value, true);
    }
  } else {
    str += stringifyPattern(
      cst.pattern,
      cst.type !== 'simple' || !!cst.declarations
    );
  }

  return str;
}

function stringifyPattern(
  { body, braces }: CST.Pattern,
  braced: boolean
): string {
  let str = braced ? (braces?.[0]?.value ?? '{{') : '';
  for (const el of body) {
    str +=
      el.type === 'text'
        ? el.value.replace(/[\\{}]/g, '\\$&')
        : stringifyExpression(el);
  }
  if (braced) str += braces?.[1]?.value ?? '}}';
  return str;
}

function stringifyExpression(
  exp: CST.Expression | CST.Junk | undefined
): string {
  if (exp?.type !== 'expression') return exp?.source ?? '';
  const { braces, arg, functionRef, markup, attributes } = exp;
  let str = braces[0]?.value ?? '{';
  if (markup) {
    str += markup.open.value + stringifyIdentifier(markup.name);
    if (markup.type === 'markup') {
      for (const opt of markup.options) str += stringifyOption(opt);
      if (markup.close) str += ' ' + markup.close.value;
    }
  } else {
    if (arg) {
      str += stringifyValue(arg);
      if (functionRef) str += ' ';
    }
    switch (functionRef?.type) {
      case 'function':
        str += functionRef.open.value + stringifyIdentifier(functionRef.name);
        for (const opt of functionRef.options) str += stringifyOption(opt);
        break;
      case 'junk':
        str += functionRef.source;
        break;
    }
  }
  for (const { name, equals, value } of attributes) {
    str += ' @' + stringifyIdentifier(name);
    if (value) str += (equals?.value ?? '=') + stringifyValue(value);
  }
  return str + (braces[1]?.value ?? '}');
}

const stringifyOption = ({ name, equals, value }: CST.Option) =>
  ' ' +
  stringifyIdentifier(name) +
  (equals?.value ?? '=') +
  stringifyValue(value);

const stringifyIdentifier = (id: CST.Identifier) =>
  id.map(part => part.value).join('');

function stringifyValue(
  value: CST.Literal | CST.VariableRef | CST.CatchallKey | CST.Junk
): string {
  switch (value.type) {
    case 'variable':
      return value.open.value + value.name;
    case 'literal':
      if (!value.quoted) return value.value;
      return (
        (value.open?.value ?? '|') +
        value.value.replace(/[\\|]/g, '\\$&') +
        (value.close?.value ?? '|')
      );
    case '*':
      return '*';
  }
  return value.source ?? '';
}
