import * as Fluent from '@fluent/syntax';
import deepEqual from 'fast-deep-equal';
import {
  Expression,
  FunctionRef,
  isFunctionRef,
  isText,
  Literal,
  Option,
  PatternMessage,
  SelectMessage,
  Text,
  VariableRef,
  Variant
} from 'messageformat';

const CATCHALL = Symbol('catchall');

interface SelectArg {
  selector: Fluent.InlineExpression;
  defaultName: string;
  keys: (string | number | typeof CATCHALL)[];
}

function asSelectArg(sel: Fluent.SelectExpression): SelectArg {
  let defaultName = '';
  const keys = sel.variants.map(v => {
    const name = v.key.type === 'Identifier' ? v.key.name : v.key.parse().value;
    if (v.default) {
      defaultName = String(name);
      return CATCHALL;
    } else {
      return name;
    }
  });
  return { selector: sel.selector, defaultName, keys };
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

function expressionToPart(
  exp: Fluent.Expression
): Literal | VariableRef | FunctionRef {
  switch (exp.type) {
    case 'NumberLiteral':
      return {
        type: 'function',
        kind: 'value',
        name: 'NUMBER',
        operand: { type: 'literal', quoted: false, value: exp.value }
      };
    case 'StringLiteral':
      return { type: 'literal', quoted: true, value: exp.parse().value };
    case 'VariableReference':
      return { type: 'variable', name: exp.id.name };
    case 'FunctionReference': {
      const func = exp.id.name;
      const { positional, named } = exp.arguments;
      const args = positional.map(exp => {
        const part = expressionToPart(exp);
        if (isFunctionRef(part))
          throw new Error(`A Fluent ${exp.type} is not supported here.`);
        return part;
      });
      if (args.length > 1) {
        throw new Error(`More than one positional argument is not supported.`);
      }
      const operand = args[0];
      if (named.length === 0)
        return { type: 'function', kind: 'value', name: func, operand };
      const options: Option[] = [];
      for (const { name, value } of named) {
        const quoted = value.type !== 'NumberLiteral';
        const litValue = quoted ? value.parse().value : value.value;
        options.push({
          name: name.name,
          value: { type: 'literal', quoted, value: litValue }
        });
      }
      return { type: 'function', kind: 'value', name: func, operand, options };
    }
    case 'MessageReference': {
      const msgId = exp.attribute
        ? `${exp.id.name}.${exp.attribute.name}`
        : exp.id.name;
      return {
        type: 'function',
        kind: 'value',
        name: 'MESSAGE',
        operand: { type: 'literal', quoted: false, value: msgId }
      };
    }
    case 'TermReference': {
      const msgId = exp.attribute
        ? `-${exp.id.name}.${exp.attribute.name}`
        : `-${exp.id.name}`;
      const operand: Literal = { type: 'literal', quoted: false, value: msgId };
      if (!exp.arguments)
        return { type: 'function', kind: 'value', name: 'MESSAGE', operand };

      const options: Option[] = [];
      for (const { name, value } of exp.arguments.named) {
        const quoted = value.type !== 'NumberLiteral';
        const litValue = quoted ? value.parse().value : value.value;
        options.push({
          name: name.name,
          value: { type: 'literal', quoted, value: litValue }
        });
      }
      return {
        type: 'function',
        kind: 'value',
        name: 'MESSAGE',
        operand,
        options
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

const elementToPart = (el: Fluent.PatternElement): Expression | Text =>
  el.type === 'TextElement'
    ? { type: 'text', value: el.value }
    : { type: 'expression', body: expressionToPart(el.expression) };

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

/**
 * Compile a {@link https://projectfluent.org/fluent.js/syntax/classes/pattern.html | Fluent.Pattern}
 * (i.e. the value of a Fluent message or an attribute) into a
 * {@link messageformat#Message} data object.
 *
 * @beta
 */
export function fluentToMessage(
  ast: Fluent.Pattern
): PatternMessage | SelectMessage {
  const args = findSelectArgs(ast);
  if (args.length === 0) {
    return {
      type: 'message',
      declarations: [],
      pattern: { body: ast.elements.map(elementToPart) }
    };
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
    keys: key.map((k, i) =>
      k === CATCHALL
        ? { type: '*', value: args[i].defaultName }
        : { type: 'literal', quoted: false, value: String(k) }
    ),
    value: { body: [] }
  }));

  /**
   * This reads `args` and modifies `variants`
   *
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
        for (const v of sel.variants) {
          const value = v.default
            ? CATCHALL
            : v.key.type === 'Identifier'
            ? v.key.name
            : v.key.parse().value;
          addParts(v.value, [...filter, { idx, value }]);
        }
      } else {
        for (const v of variants) {
          const vp = v.value.body;
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
            if (isText(last) && isText(part)) last.value += part.value;
            else vp.push(part);
          }
        }
      }
    }
  }
  addParts(ast, []);

  return {
    type: 'select',
    declarations: [],
    selectors: args.map(arg => ({
      type: 'expression',
      body: expressionToPart(arg.selector)
    })),
    variants
  };
}
