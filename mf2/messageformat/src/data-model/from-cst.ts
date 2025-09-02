import type * as Model from './types.ts';
import { MessageSyntaxError } from '../errors.ts';
import type * as CST from '../cst/types.ts';

/**
 * Shared symbol used as a key on message data model nodes
 * to reference their CST source.
 *
 * Only set on message data model nodes when parsed by {@link messageFromCST}.
 */
export const cstKey = Symbol.for('CST');

/**
 * Convert a CST message structure into its data model representation.
 *
 * In the returned {@link Model.Message},
 * all nodes include a reference to their source {@link CST} node
 * as a {@link cstKey} symbol-keyed property.
 */
export function messageFromCST(msg: CST.Message): Model.Message {
  for (const error of msg.errors) throw error;
  const declarations: Model.Declaration[] = msg.declarations
    ? msg.declarations.map(asDeclaration)
    : [];
  if (msg.type === 'select') {
    return {
      type: 'select',
      declarations,
      selectors: msg.selectors.map(sel => asValue(sel)),
      variants: msg.variants.map(variant => ({
        keys: variant.keys.map(key =>
          key.type === '*' ? { type: '*', [cstKey]: key } : asValue(key)
        ),
        value: asPattern(variant.value),
        [cstKey]: variant
      })),
      [cstKey]: msg
    };
  } else {
    return {
      type: 'message',
      declarations,
      pattern: asPattern(msg.pattern),
      [cstKey]: msg
    };
  }
}

function asDeclaration(decl: CST.Declaration): Model.Declaration {
  switch (decl.type) {
    case 'input': {
      const value = asExpression(decl.value, false);
      if (value.arg?.type !== 'variable') {
        const { start, end } = decl.value;
        throw new MessageSyntaxError('parse-error', start, end);
      }
      return {
        type: 'input',
        name: value.arg.name,
        value: value as Model.Expression<Model.VariableRef>,
        [cstKey]: decl
      };
    }
    case 'local':
      return {
        type: 'local',
        name: asValue(decl.target).name,
        value: asExpression(decl.value, false),
        [cstKey]: decl
      };
    default:
      throw new MessageSyntaxError('parse-error', decl.start, decl.end);
  }
}

const asPattern = (pattern: CST.Pattern) =>
  pattern.body.map(el =>
    el.type === 'text' ? el.value : asExpression(el, true)
  );

function asExpression(
  exp: CST.Expression | CST.Junk,
  allowMarkup: false
): Model.Expression;
function asExpression(
  exp: CST.Expression | CST.Junk,
  allowMarkup: true
): Model.Expression | Model.Markup;
function asExpression(
  exp: CST.Expression | CST.Junk,
  allowMarkup: boolean
): Model.Expression | Model.Markup {
  if (exp.type === 'expression') {
    if (allowMarkup && exp.markup) {
      const cm = exp.markup;
      const name = asName(cm.name);
      const kind =
        cm.open.value === '/' ? 'close' : cm.close ? 'standalone' : 'open';
      const markup: Model.Markup = { type: 'markup', kind, name };
      if (cm.options.length) markup.options = asOptions(cm.options);
      if (exp.attributes.length) {
        markup.attributes = asAttributes(exp.attributes);
      }
      markup[cstKey] = exp;
      return markup;
    }

    const arg = exp.arg ? asValue(exp.arg) : undefined;
    let functionRef: Model.FunctionRef | undefined;

    const ca = exp.functionRef;
    if (ca) {
      if (ca.type === 'function') {
        functionRef = { type: 'function', name: asName(ca.name) };
        if (ca.options.length) functionRef.options = asOptions(ca.options);
      } else {
        throw new MessageSyntaxError('parse-error', exp.start, exp.end);
      }
    }
    let expression: Model.Expression | undefined = arg
      ? { type: 'expression', arg }
      : undefined;
    if (functionRef) {
      functionRef[cstKey] = ca;
      if (expression) expression.functionRef = functionRef;
      else expression = { type: 'expression', functionRef: functionRef };
    }
    if (expression) {
      if (exp.attributes.length) {
        expression.attributes = asAttributes(exp.attributes);
      }
      expression[cstKey] = exp;
      return expression;
    }
  }
  throw new MessageSyntaxError('parse-error', exp.start, exp.end);
}

function asOptions(options: CST.Option[]): Model.Options {
  const map: Model.Options = {};
  for (const opt of options) {
    const name = asName(opt.name);
    if (Object.hasOwn(map, name)) {
      throw new MessageSyntaxError('duplicate-option-name', opt.start, opt.end);
    }
    map[name] = asValue(opt.value);
  }
  return map;
}

function asAttributes(attributes: CST.Attribute[]): Model.Attributes {
  const map: Model.Attributes = {};
  for (const attr of attributes) {
    const name = asName(attr.name);
    if (Object.hasOwn(map, name)) {
      throw new MessageSyntaxError('duplicate-attribute', attr.start, attr.end);
    }
    map[name] = attr.value ? asValue(attr.value) : true;
  }
  return map;
}

function asName(id: CST.Identifier): string {
  switch (id.length) {
    case 1:
      return id[0].value;
    case 3:
      return `${id[0].value}:${id[2].value}`;
    default:
      throw new MessageSyntaxError(
        'parse-error',
        id[0]?.start ?? -1,
        id.at(-1)?.end ?? -1
      );
  }
}

function asValue(value: CST.Literal | CST.Junk): Model.Literal;
function asValue(value: CST.VariableRef | CST.Junk): Model.VariableRef;
function asValue(
  value: CST.Literal | CST.VariableRef | CST.Junk
): Model.Literal | Model.VariableRef;
function asValue(
  value: CST.Literal | CST.VariableRef | CST.Junk
): Model.Literal | Model.VariableRef {
  switch (value.type) {
    case 'literal':
      return { type: 'literal', value: value.value, [cstKey]: value };
    case 'variable':
      return { type: 'variable', name: value.name, [cstKey]: value };
    default:
      throw new MessageSyntaxError('parse-error', value.start, value.end);
  }
}
