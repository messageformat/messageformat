import * as Fluent from '@fluent/syntax';
import deepEqual from 'fast-deep-equal';
import {
  Expression,
  isExpression,
  isLiteral,
  Literal,
  Message,
  Option,
  PatternMessage,
  SelectMessage,
  VariableRef,
  Variant
} from 'messageformat';

type Part = Literal | VariableRef | Expression;

const CATCHALL = Symbol('catchall');

interface SelectArg {
  selector: Fluent.InlineExpression;
  keys: (string | number | symbol)[];
}

const variantKey = (v: Fluent.Variant) =>
  v.default
    ? CATCHALL
    : v.key.type === 'Identifier'
    ? v.key.name
    : v.key.parse().value;

function asSelectArg(sel: Fluent.SelectExpression): SelectArg {
  const keys = sel.variants.map(variantKey);
  return { selector: sel.selector, keys };
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
        type: 'expression',
        name: 'NUMBER',
        operand: { type: 'literal', value: exp.value }
      };
    case 'StringLiteral':
      return { type: 'literal', value: exp.parse().value };
    case 'VariableReference':
      return { type: 'variable', name: exp.id.name };
    case 'FunctionReference': {
      const func = exp.id.name;
      const { positional, named } = exp.arguments;
      const args = positional.map(exp => {
        const part = expressionToPart(exp);
        if (isExpression(part))
          throw new Error(`A Fluent ${exp.type} is not supported here.`);
        return part;
      });
      if (args.length > 1) {
        throw new Error(`More than one positional argument is not supported.`);
      }
      const operand = args[0];
      if (named.length === 0)
        return { type: 'expression', name: func, operand };
      const options: Option[] = [];
      for (const { name, value } of named) {
        options.push({
          name: name.name,
          value: {
            type: 'literal',
            value:
              value.type === 'NumberLiteral' ? value.value : value.parse().value
          }
        });
      }
      return { type: 'expression', name: func, operand, options };
    }
    case 'MessageReference': {
      const msgId = exp.attribute
        ? `${exp.id.name}.${exp.attribute.name}`
        : exp.id.name;
      return {
        type: 'expression',
        name: 'MESSAGE',
        operand: { type: 'literal', value: msgId }
      };
    }
    case 'TermReference': {
      const msgId = exp.attribute
        ? `-${exp.id.name}.${exp.attribute.name}`
        : `-${exp.id.name}`;
      const operand: Literal = { type: 'literal', value: msgId };
      if (!exp.arguments)
        return { type: 'expression', name: 'MESSAGE', operand };

      const options: Option[] = [];
      for (const { name, value } of exp.arguments.named) {
        options.push({
          name: name.name,
          value: {
            type: 'literal',
            value:
              value.type === 'NumberLiteral' ? value.value : value.parse().value
          }
        });
      }
      return { type: 'expression', name: 'MESSAGE', operand, options };
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
    const msg: PatternMessage = {
      type: 'message',
      pattern: ast.elements.map(elementToPart)
    };
    if (comment) msg.comment = comment.content;
    return msg;
  }

  // First determine the keys for all cases, with empty values
  let keys: (string | number | symbol)[][] = [];
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    const kk = Array.from(new Set(arg.keys));
    kk.sort((a, b) => {
      if (a === CATCHALL) return 1;
      if (typeof a === 'number' || b === CATCHALL) return -1;
      if (typeof b === 'number') return 1;
      return 0;
    });
    if (i === 0) keys = kk.map(key => [key]);
    else
      for (let i = keys.length - 1; i >= 0; --i)
        keys.splice(i, 1, ...kk.map(key => [...keys[i], key]));
  }
  const variants: Variant[] = keys.map(key => ({
    keys: key.map(k =>
      k === CATCHALL ? { type: '*' } : { type: 'nmtoken', value: String(k) }
    ),
    value: { type: 'message', pattern: [] }
  }));

  /**
   * This reads `args` and modifies `cases`
   *
   * @param pluralArg - Required by # octothorpes
   * @param filter - Selects which cases we're adding to
   */
  function addParts(
    pattern: Fluent.Pattern,
    filter: readonly { idx: number; value: string | number | symbol }[]
  ) {
    for (const el of pattern.elements) {
      const sel = asFluentSelect(el);
      if (sel) {
        const idx = args.findIndex(a => deepEqual(a.selector, sel.selector));
        for (const v of sel.variants)
          addParts(v.value, [...filter, { idx, value: variantKey(v) }]);
      } else {
        for (const v of variants) {
          const vp = v.value.pattern;
          if (
            filter.every(({ idx, value }) => {
              const vi = v.keys[idx];
              return vi.type === '*'
                ? value === CATCHALL
                : String(value) === vi.value;
            })
          ) {
            const last = vp[vp.length - 1];
            const part = elementToPart(el);
            if (isLiteral(last) && isLiteral(part)) last.value += part.value;
            else vp.push(part);
          }
        }
      }
    }
  }
  addParts(ast, []);

  const selectors = args.map(arg => expressionToPart(arg.selector));
  const msg: SelectMessage = { type: 'select', selectors, variants };
  if (comment) msg.comment = comment.content;
  return msg;
}
