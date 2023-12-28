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
  const declarations: Model.Declaration[] = msg.declarations
    ? msg.declarations.map(asDeclaration)
    : [];
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

function asDeclaration(decl: CST.Declaration): Model.Declaration {
  switch (decl.type) {
    case 'input': {
      const value = asExpression(decl.value);
      if (value.arg?.type !== 'variable') {
        const { start, end } = decl.value;
        throw new MessageSyntaxError('parse-error', start, end);
      }
      return {
        type: 'input',
        name: value.arg.name,
        value: value as Model.Expression<Model.VariableRef>
      };
    }
    case 'local':
      return {
        type: 'local',
        name: asValue(decl.target).name,
        value: asExpression(decl.value)
      };
    default:
      return {
        type: 'unsupported-statement',
        keyword: (decl.keyword?.value ?? '').substring(1),
        body: decl.body?.value || undefined,
        expressions: decl.values?.map(asExpression) ?? []
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
  if (cst.type === 'expression') {
    const arg = cst.arg ? asValue(cst.arg) : undefined;
    let annotation:
      | Model.FunctionAnnotation
      | Model.UnsupportedAnnotation
      | undefined;
    const ca = cst.annotation;
    if (ca) {
      switch (ca.type) {
        case 'function':
          annotation = { type: 'function', kind: ca.kind, name: ca.name };
          if (ca.options && ca.options.length > 0) {
            annotation.options = ca.options.map(opt => ({
              name: opt.name,
              value: asValue(opt.value)
            }));
          }
          break;
        case 'reserved-annotation':
          annotation = {
            type: 'unsupported-annotation',
            sigil: ca.sigil,
            source: ca.source.value
          };
          break;
        default:
          throw new MessageSyntaxError('parse-error', cst.start, cst.end);
      }
    }
    if (arg) {
      return annotation
        ? { type: 'expression', arg, annotation }
        : { type: 'expression', arg };
    } else if (annotation) {
      return { type: 'expression', annotation };
    }
  }
  throw new MessageSyntaxError('parse-error', cst.start, cst.end);
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
