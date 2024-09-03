import type * as Model from './types.js';
import { MessageSyntaxError } from '../errors.js';
import type * as CST from '../cst/types.js';

/**
 * Shared symbol used as a key on message data model nodes
 * to reference their CST source.
 *
 * @beta
 */
export const cst = Symbol.for('CST');

/**
 * Convert a CST message structure into its data model representation.
 *
 * @beta
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
          key.type === '*' ? { type: '*', [cst]: key } : asValue(key)
        ),
        value: asPattern(variant.value),
        [cst]: variant
      })),
      [cst]: msg
    };
  } else {
    return {
      type: 'message',
      declarations,
      pattern: asPattern(msg.pattern),
      [cst]: msg
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
        [cst]: decl
      };
    }
    case 'local':
      return {
        type: 'local',
        name: asValue(decl.target).name,
        value: asExpression(decl.value, false),
        [cst]: decl
      };
    default:
      return {
        type: 'unsupported-statement',
        keyword: (decl.keyword?.value ?? '').substring(1),
        body: decl.body?.value || undefined,
        expressions: decl.values?.map(dv => asExpression(dv, true)) ?? [],
        [cst]: decl
      };
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
      markup[cst] = exp;
      return markup;
    }

    const arg = exp.arg ? asValue(exp.arg) : undefined;
    let annotation:
      | Model.FunctionAnnotation
      | Model.UnsupportedAnnotation
      | undefined;

    const ca = exp.annotation;
    if (ca) {
      switch (ca.type) {
        case 'function':
          annotation = { type: 'function', name: asName(ca.name) };
          if (ca.options.length) annotation.options = asOptions(ca.options);
          break;
        case 'reserved-annotation':
          annotation = {
            type: 'unsupported-annotation',
            source: ca.open.value + ca.source.value
          };
          break;
        default:
          throw new MessageSyntaxError('parse-error', exp.start, exp.end);
      }
    }
    let expression: Model.Expression | undefined = arg
      ? { type: 'expression', arg }
      : undefined;
    if (annotation) {
      annotation[cst] = ca;
      if (expression) expression.annotation = annotation;
      else expression = { type: 'expression', annotation };
    }
    if (expression) {
      if (exp.attributes.length) {
        expression.attributes = asAttributes(exp.attributes);
      }
      expression[cst] = exp;
      return expression;
    }
  }
  throw new MessageSyntaxError('parse-error', exp.start, exp.end);
}

function asOptions(options: CST.Option[]): Model.Options {
  const map: Model.Options = new Map();
  for (const opt of options) {
    const name = asName(opt.name);
    if (map.has(name)) {
      throw new MessageSyntaxError('duplicate-option-name', opt.start, opt.end);
    }
    map.set(name, asValue(opt.value));
  }
  return map;
}

function asAttributes(attributes: CST.Attribute[]): Model.Attributes {
  const map: Model.Attributes = new Map();
  for (const attr of attributes) {
    const name = asName(attr.name);
    if (map.has(name)) {
      throw new MessageSyntaxError('duplicate-attribute', attr.start, attr.end);
    }
    map.set(name, attr.value ? asValue(attr.value) : true);
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
      return { type: 'literal', value: value.value, [cst]: value };
    case 'variable':
      return { type: 'variable', name: value.name, [cst]: value };
    default:
      throw new MessageSyntaxError('parse-error', value.start, value.end);
  }
}
