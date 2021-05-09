import * as Fluent from '@fluent/syntax';
import deepEqual from 'fast-deep-equal';
import { Message, Part, SelectCase } from 'messageformat';

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
      // TODO: Account for precision?
      return exp.parse().value;
    case 'StringLiteral':
      return exp.parse().value;
    case 'VariableReference':
      return { var_path: [exp.id.name] };
    case 'FunctionReference': {
      const func = exp.id.name;
      const { positional, named } = exp.arguments;
      const args = positional.map(expressionToPart);
      if (named.length === 0) return { func, args };
      const options: Record<string, string | number> = {};
      for (const { name, value } of named)
        options[name.name] = value.parse().value;
      return { func, args, options };
    }
    case 'MessageReference': {
      const id = exp.attribute
        ? `${exp.id.name}.${exp.attribute.name}`
        : exp.id.name;
      return { msg_path: [id] };
    }
    case 'TermReference': {
      const id = exp.attribute
        ? `-${exp.id.name}.${exp.attribute.name}`
        : `-${exp.id.name}`;
      if (!exp.arguments) return { msg_path: [id] };
      const scope: Record<string, string | number> = {};
      for (const { name, value } of exp.arguments.named)
        scope[name.name] = value.parse().value;
      return { msg_path: [id], scope };
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
  el.type === 'TextElement' ? el.value : expressionToPart(el.expression);

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
    return comment ? { value, meta: { comment: comment.content } } : { value };
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
  const cases: SelectCase[] = keys.map(key => ({ key, value: [] }));

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
        const part = elementToPart(el);
        for (const c of cases)
          if (filter.every(({ idx, value }) => c.key[idx] === value)) {
            const end = c.value.length - 1;
            if (typeof c.value[end] === 'string' && typeof part === 'string')
              c.value[end] += part;
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
    return { value, default: arg.default };
  });
  const value = { select, cases };
  return comment ? { value, meta: { comment: comment.content } } : { value };
}
