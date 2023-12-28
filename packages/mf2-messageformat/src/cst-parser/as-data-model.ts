import type * as Model from '../data-model.js';
import { MessageSyntaxError } from '../errors.js';
import type * as CST from './cst-types.js';

/**
 * Convert a CST message structure into its data model representation.
 *
 * @beta
 */
export function asDataModel(msg: CST.Message): Model.Message {
  for (const error of msg.errors) throw error;
  const declarations: Model.Declaration[] = (msg.declarations ?? []).map(
    decl => ({
      name: asValue(decl.target).name,
      value: asExpression(decl.value)
    })
  );
  if (msg.type === 'select') {
    return {
      type: 'select',
      declarations,
      selectors: msg.selectors.map(asExpression),
      variants: msg.variants.map(cst => ({
        keys: cst.keys.map(key =>
          key.type === '*' ? { type: '*' } : asValue(key)
        ),
        value: asPattern(cst.value)
      }))
    };
  } else {
    return {
      type: 'message',
      declarations,
      pattern: asPattern(msg.pattern)
    };
  }
}

function asPattern(cst: CST.Pattern): Model.Pattern {
  const body: Model.Pattern['body'] = cst.body.map(el =>
    el.type === 'text' ? el.value : asExpression(el)
  );
  return { body };
}

function asExpression(cst: CST.Expression | CST.Junk): Model.Expression {
  if (cst.type !== 'expression') {
    throw new MessageSyntaxError('parse-error', cst.start, cst.end);
  }
  switch (cst.body.type) {
    case 'literal':
    case 'variable':
      return { type: 'expression', arg: asValue(cst.body) };
    case 'function':
      return asFunctionExpression(cst.body);
    case 'reserved':
      return asUnsupportedExpression(cst.body);
    default:
      throw new MessageSyntaxError('parse-error', cst.start, cst.end);
  }
}

function asFunctionExpression(cst: CST.FunctionRef): Model.Expression {
  const annotation: Model.FunctionAnnotation = {
    type: 'function',
    kind: cst.kind,
    name: cst.name
  };
  if (cst.options && cst.options.length > 0) {
    annotation.options = cst.options.map(opt => ({
      name: opt.name,
      value: asValue(opt.value)
    }));
  }
  return cst.operand
    ? { type: 'expression', arg: asValue(cst.operand), annotation }
    : { type: 'expression', annotation };
}

function asUnsupportedExpression(cst: CST.Reserved): Model.Expression {
  const annotation: Model.UnsupportedAnnotation = {
    type: 'unsupported-annotation',
    sigil: cst.sigil,
    source: cst.source
  };
  return cst.operand
    ? { type: 'expression', arg: asValue(cst.operand), annotation }
    : { type: 'expression', annotation };
}

function asValue(cst: CST.Literal | CST.Junk): Model.Literal;
function asValue(cst: CST.VariableRef | CST.Junk): Model.VariableRef;
function asValue(
  cst: CST.Literal | CST.VariableRef | CST.Junk
): Model.Literal | Model.VariableRef;
function asValue(
  cst: CST.Literal | CST.VariableRef | CST.Junk
): Model.Literal | Model.VariableRef {
  switch (cst.type) {
    case 'literal':
      return { type: 'literal', value: cst.value };
    case 'variable':
      return { type: 'variable', name: cst.name };
    default:
      throw new MessageSyntaxError('parse-error', cst.start, cst.end);
  }
}
