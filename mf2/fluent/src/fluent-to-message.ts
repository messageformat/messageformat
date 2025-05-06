import * as Fluent from '@fluent/syntax';
import deepEqual from 'fast-deep-equal';
import type { Model as MF } from 'messageformat';

const CATCHALL = Symbol('catchall');

interface SelectArg {
  selector: Fluent.InlineExpression;
  defaultName: string;
  keys: (string | number | typeof CATCHALL)[];
}

function findSelectArgs(pattern: Fluent.Pattern): SelectArg[] {
  const args: SelectArg[] = [];
  const add = (arg: SelectArg) => {
    const prev = args.find(a => deepEqual(a.selector, arg.selector));
    if (prev) for (const key of arg.keys) prev.keys.push(key);
    else args.push(arg);
  };

  for (const el of pattern.elements) {
    if (el.type === 'Placeable' && el.expression.type === 'SelectExpression') {
      const { selector, variants } = el.expression;
      let defaultName = '';
      const keys = variants.map(v => {
        const name =
          v.key.type === 'Identifier' ? v.key.name : v.key.parse().value;
        if (v.default) {
          defaultName = String(name);
          return CATCHALL;
        } else {
          return name;
        }
      });
      add({ selector, defaultName, keys });
      for (const v of variants) {
        for (const arg of findSelectArgs(v.value)) add(arg);
      }
    }
  }
  return args;
}

function asSelectorDeclaration(
  { selector, defaultName, keys }: SelectArg,
  index: number,
  detectNumberSelection: boolean = true
): MF.InputDeclaration | MF.LocalDeclaration {
  switch (selector.type) {
    case 'StringLiteral':
      return {
        type: 'local',
        name: `_${index}`,
        value: {
          type: 'expression',
          arg: asValue(selector),
          functionRef: { type: 'function', name: 'string' }
        }
      };
    case 'VariableReference': {
      let name = detectNumberSelection ? 'number' : 'string';
      if (name === 'number') {
        for (const key of [...keys, defaultName]) {
          if (
            typeof key === 'string' &&
            !['zero', 'one', 'two', 'few', 'many', 'other'].includes(key)
          ) {
            name = 'string';
            break;
          }
        }
      }
      return {
        type: 'input',
        name: selector.id.name,
        value: {
          type: 'expression',
          arg: asValue(selector),
          functionRef: { type: 'function', name }
        }
      };
    }
  }
  const exp = asExpression(selector);
  return exp.arg?.type === 'variable'
    ? {
        type: 'input',
        name: exp.arg.name,
        value: exp as MF.Expression<MF.VariableRef>
      }
    : { type: 'local', name: `_${index}`, value: exp };
}

function asValue(exp: Fluent.VariableReference): MF.VariableRef;
function asValue(exp: Fluent.InlineExpression): MF.Literal | MF.VariableRef;
function asValue(exp: Fluent.InlineExpression): MF.Literal | MF.VariableRef {
  switch (exp.type) {
    case 'NumberLiteral':
      return { type: 'literal', value: exp.value };
    case 'StringLiteral':
      return { type: 'literal', value: exp.parse().value };
    case 'VariableReference':
      return { type: 'variable', name: exp.id.name };
    default:
      throw new Error(`A Fluent ${exp.type} is not supported here.`);
  }
}

function asExpression(exp: Fluent.Expression): MF.Expression {
  switch (exp.type) {
    case 'NumberLiteral':
      return {
        type: 'expression',
        arg: asValue(exp),
        functionRef: { type: 'function', name: 'number' }
      };
    case 'StringLiteral':
    case 'VariableReference': {
      return { type: 'expression', arg: asValue(exp) };
    }
    case 'FunctionReference': {
      const annotation: MF.FunctionRef = {
        type: 'function',
        name: exp.id.name.toLowerCase()
      };
      const { positional, named } = exp.arguments;
      const args = positional.map(asValue);
      if (args.length > 1) {
        throw new Error(`More than one positional argument is not supported.`);
      }
      if (named.length > 0) {
        annotation.options = new Map();
        for (const { name, value } of named) {
          const quoted = value.type !== 'NumberLiteral';
          const litValue = quoted ? value.parse().value : value.value;
          annotation.options.set(name.name, {
            type: 'literal',
            value: litValue
          });
        }
      }
      if (annotation.name === 'number') {
        const style = annotation.options?.get('style');
        if (style?.type === 'literal') {
          switch (style.value) {
            case 'decimal':
              break;
            case 'currency':
            case 'unit':
              annotation.name = style.value;
              break;
            default:
              throw new Error(
                `Unsupported NUMBER(..., style=${JSON.stringify(style.value)})`
              );
          }
          annotation.options!.delete('style');
        }
      }
      return args.length > 0
        ? { type: 'expression', arg: args[0], functionRef: annotation }
        : { type: 'expression', functionRef: annotation };
    }
    case 'MessageReference': {
      const msgId = exp.attribute
        ? `${exp.id.name}.${exp.attribute.name}`
        : exp.id.name;
      return {
        type: 'expression',
        arg: { type: 'literal', value: msgId },
        functionRef: { type: 'function', name: 'fluent:message' }
      };
    }
    case 'TermReference': {
      const annotation: MF.FunctionRef = {
        type: 'function',
        name: 'fluent:message'
      };
      const msgId = exp.attribute
        ? `-${exp.id.name}.${exp.attribute.name}`
        : `-${exp.id.name}`;
      if (exp.arguments?.named.length) {
        annotation.options = new Map();
        for (const { name, value } of exp.arguments.named) {
          const quoted = value.type !== 'NumberLiteral';
          const litValue = quoted ? value.parse().value : value.value;
          annotation.options.set(name.name, {
            type: 'literal',
            value: litValue
          });
        }
      }
      return {
        type: 'expression',
        arg: { type: 'literal', value: msgId },
        functionRef: annotation
      };
    }

    /* istanbul ignore next - never happens */
    case 'Placeable':
      return asExpression(exp.expression);

    /* istanbul ignore next - never happens */
    default:
      throw new Error(`${exp.type} not supported here`);
  }
}

const elementToPart = (el: Fluent.PatternElement): string | MF.Expression =>
  el.type === 'TextElement' ? el.value : asExpression(el.expression);

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
 * {@link MF.Message | Model.Message} data object.
 *
 * @param options.detectNumberSelection - Set `false` to disable number selector detection based on keys.
 */
export function fluentToMessage(
  ast: Fluent.Pattern,
  options?: { detectNumberSelection?: boolean }
): MF.PatternMessage | MF.SelectMessage {
  const args = findSelectArgs(ast);
  if (args.length === 0) {
    return {
      type: 'message',
      declarations: [],
      pattern: ast.elements.map(elementToPart)
    };
  }

  // First determine the keys for all cases, with empty values
  let keys: (string | number | symbol)[][] = [];
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    const sk = new Set(arg.keys);
    if (i === 0) {
      keys = Array.from(sk, key => [key]);
    } else {
      for (let i = keys.length - 1; i >= 0; --i) {
        keys.splice(i, 1, ...Array.from(sk, key => [...keys[i], key]));
      }
    }
  }
  const variants: MF.Variant[] = keys.map(key => ({
    keys: key.map((k, i) =>
      k === CATCHALL
        ? { type: '*', value: args[i].defaultName }
        : { type: 'literal', value: String(k) }
    ),
    value: []
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
          const vp = v.value;
          if (
            filter.every(({ idx, value }) => {
              const vi = v.keys[idx];
              return vi.type === '*'
                ? value === CATCHALL
                : String(value) === vi.value;
            })
          ) {
            const i = vp.length - 1;
            const part = elementToPart(el);
            if (typeof vp[i] === 'string' && typeof part === 'string') {
              vp[i] += part;
            } else {
              vp.push(part);
            }
          }
        }
      }
    }
  }
  addParts(ast, []);

  const declarations = args.map((arg, index) =>
    asSelectorDeclaration(arg, index, options?.detectNumberSelection)
  );
  return {
    type: 'select',
    declarations,
    selectors: declarations.map(decl => ({
      type: 'variable',
      name: decl.name
    })),
    variants
  };
}
