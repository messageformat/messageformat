import * as Fluent from '@fluent/syntax';
import deepEqual from 'fast-deep-equal';
import {
  hasMeta,
  isFunction,
  isLiteral,
  isTerm,
  Message,
  Options,
  Part,
  SelectCase
} from 'messageformat';

interface SelectArg {
  selector: Fluent.InlineExpression;
  default: string | number;
  keys: (string | number)[];
}

const variantKey = ({ key }: Fluent.Variant) =>
  key.type === 'Identifier' ? key.name : key.parse().value;

function asSelectArg(sel: Fluent.SelectExpression): SelectArg {
  let def: string | number = '';
  const keys = sel.variants.map(v => {
    const id = variantKey(v);
    if (v.default) def = id;
    return id;
  });
  return { selector: sel.selector, default: def, keys };
}

function findSelectArgs(pattern: Fluent.Pattern): SelectArg[] {
  const args: SelectArg[] = [];
  const add = (arg: SelectArg) => {
    const prev = args.find(a => deepEqual(a.selector, arg.selector));
    if (prev) for (const key of arg.keys) prev.keys.push(key);
    else args.push(arg);
  };
  for (const el of pattern.elements)
    if (el.type === 'Placeable' && el.expression.type === 'SelectExpression') {
      add(asSelectArg(el.expression));
      for (const v of el.expression.variants)
        for (const arg of findSelectArgs(v.value)) add(arg);
    }
  return args;
}

function expressionToPart(exp: Fluent.Expression): Part {
  switch (exp.type) {
    case 'NumberLiteral':
      return {
        type: 'function',
        func: 'NUMBER',
        args: [{ type: 'literal', value: exp.value }]
      };
    case 'StringLiteral':
      return { type: 'literal', value: exp.parse().value };
    case 'VariableReference':
      return {
        type: 'variable',
        var_path: [{ type: 'literal', value: exp.id.name }]
      };
    case 'FunctionReference': {
      const func = exp.id.name;
      const { positional, named } = exp.arguments;
      const args = positional.map(exp => {
        const part = expressionToPart(exp);
        if (isFunction(part) || isTerm(part))
          throw new Error(`A Fluent ${exp.type} is not supported here.`);
        return part;
      });
      if (named.length === 0) return { type: 'function', func, args };
      const options: Options = {};
      for (const { name, value } of named)
        options[name.name] = {
          type: 'literal',
          value:
            value.type === 'NumberLiteral' ? value.value : value.parse().value
        };
      return { type: 'function', func, args, options };
    }
    case 'MessageReference': {
      const id = exp.attribute
        ? `${exp.id.name}.${exp.attribute.name}`
        : exp.id.name;
      return { type: 'term', msg_path: [{ type: 'literal', value: id }] };
    }
    case 'TermReference': {
      const id = exp.attribute
        ? `-${exp.id.name}.${exp.attribute.name}`
        : `-${exp.id.name}`;
      if (!exp.arguments)
        return { type: 'term', msg_path: [{ type: 'literal', value: id }] };
      const scope: Options = {};
      for (const { name, value } of exp.arguments.named)
        scope[name.name] = {
          type: 'literal',
          value:
            value.type === 'NumberLiteral' ? value.value : value.parse().value
        };
      return {
        type: 'term',
        msg_path: [{ type: 'literal', value: id }],
        scope
      };
    }

    /* istanbul ignore next - never happens */
    case 'Placeable':
      return expressionToPart(exp.expression);

    /* istanbul ignore next - never happens */
    default:
      throw new Error(`${exp.type} not supported here`);
  }
}

const elementToPart = (el: Fluent.PatternElement): Part =>
  el.type === 'TextElement'
    ? { type: 'literal', value: el.value }
    : expressionToPart(el.expression);

function asFluentSelect(
  el: Fluent.PatternElement
): Fluent.SelectExpression | null {
  if (el.type === 'TextElement') return null;
  switch (el.expression.type) {
    case 'SelectExpression':
      return el.expression;

    /* istanbul ignore next - never happens */
    case 'Placeable':
      return asFluentSelect(el.expression);

    default:
      return null;
  }
}

export function astToMessage(
  ast: Fluent.Pattern,
  comment: Fluent.Comment | null
): Message {
  const args = findSelectArgs(ast);
  if (args.length === 0) {
    const value = ast.elements.map(elementToPart);
    return comment
      ? { type: 'message', value, meta: { comment: comment.content } }
      : { type: 'message', value };
  }

  // First determine the keys for all cases, with empty values
  let keys: (string | number)[][] = [];
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    const kk = Array.from(new Set(arg.keys));
    const def = arg.default;
    kk.sort((a, b) => {
      if (a === def) return 1;
      if (typeof a === 'number' || b === def) return -1;
      if (typeof b === 'number') return 1;
      return 0;
    });
    if (i === 0) keys = kk.map(key => [key]);
    else
      for (let i = keys.length - 1; i >= 0; --i)
        keys.splice(i, 1, ...kk.map(key => [...keys[i], key]));
  }
  const cases: SelectCase[] = keys.map(key => ({
    key: key.map(k => String(k)),
    value: []
  }));

  /**
   * This reads `args` and modifies `cases`
   *
   * @param pluralArg - Required by # octothorpes
   * @param filter - Selects which cases we're adding to
   */
  function addParts(
    pattern: Fluent.Pattern,
    filter: readonly { idx: number; value: string | number }[]
  ) {
    for (const el of pattern.elements) {
      const sel = asFluentSelect(el);
      if (sel) {
        const idx = args.findIndex(a => deepEqual(a.selector, sel.selector));
        for (const v of sel.variants)
          addParts(v.value, [...filter, { idx, value: variantKey(v) }]);
      } else {
        for (const c of cases)
          if (filter.every(({ idx, value }) => c.key[idx] === String(value))) {
            const last = c.value[c.value.length - 1];
            const part = elementToPart(el);
            if (
              isLiteral(last) &&
              isLiteral(part) &&
              !hasMeta(last) &&
              !hasMeta(part)
            )
              last.value += part.value;
            else c.value.push(part);
          }
      }
    }
  }
  addParts(ast, []);

  const select = args.map(arg => {
    const value = expressionToPart(arg.selector);
    if (typeof value === 'object' && 'func' in value && value.func === 'NUMBER')
      value.func = 'plural';
    return { value, default: String(arg.default) };
  });
  const value = { select, cases };
  return comment
    ? { type: 'select', value, meta: { comment: comment.content } }
    : { type: 'select', value };
}
