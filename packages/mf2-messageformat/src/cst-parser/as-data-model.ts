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
  const declarations: Model.Declaration[] = msg.declarations.map(decl => ({
    name: asValue(decl.target).name,
    value: asExpression(decl.value)
  }));
  switch (msg.type) {
    case 'message':
      return {
        type: 'message',
        declarations,
        pattern: asPattern(msg.pattern)
      };
    case 'select':
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
    default:
      throw new MessageSyntaxError('parse-error', 0, msg.source?.length ?? 0);
  }
}

function asPattern(cst: CST.Pattern): Model.Pattern {
  const body: Model.Pattern['body'] = cst.body.map(el =>
    el.type === 'text' ? { type: 'text', value: el.value } : asExpression(el)
  );
  return { body };
}

function asExpression(cst: CST.Expression | CST.Junk): Model.Expression {
  if (cst.type !== 'expression') {
    throw new MessageSyntaxError('parse-error', cst.start, cst.end);
  }
  let body:
    | Model.Literal
    | Model.VariableRef
    | Model.FunctionRef
    | Model.Reserved;
  switch (cst.body.type) {
    case 'literal':
    case 'variable':
      body = asValue(cst.body);
      break;
    case 'function':
      body = asFunctionRef(cst.body);
      break;
    case 'reserved':
      body = asReserved(cst.body);
      break;
    default:
      throw new MessageSyntaxError('parse-error', cst.start, cst.end);
  }
  return { type: 'expression', body };
}

function asFunctionRef(cst: CST.FunctionRef): Model.FunctionRef {
  const fn: Model.FunctionRef = {
    type: 'function',
    kind: cst.kind,
    name: cst.name
  };
  if (cst.operand) fn.operand = asValue(cst.operand);
  if (cst.options && cst.options.length > 0) {
    fn.options = cst.options.map(opt => ({
      name: opt.name,
      value: asValue(opt.value)
    }));
  }
  return fn;
}

function asReserved(cst: CST.Reserved): Model.Reserved {
  const res: Model.Reserved = {
    type: 'reserved',
    sigil: cst.sigil,
    source: cst.source
  };
  if (cst.operand) res.operand = asValue(cst.operand);
  return res;
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
      return { type: 'literal', quoted: cst.quoted, value: cst.value };
    case 'variable':
      return { type: 'variable', name: cst.name };
    default:
      throw new MessageSyntaxError('parse-error', cst.start, cst.end);
  }
}
