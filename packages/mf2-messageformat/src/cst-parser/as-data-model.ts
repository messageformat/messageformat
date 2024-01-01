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
      selectors: msg.selectors.map(sel => asExpression(sel, false)),
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
      const value = asExpression(decl.value, false);
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
        value: asExpression(decl.value, false)
      };
    default:
      return {
        type: 'unsupported-statement',
        keyword: (decl.keyword?.value ?? '').substring(1),
        body: decl.body?.value || undefined,
        expressions: decl.values?.map(dv => asExpression(dv, true)) ?? []
      };
  }
}

function asPattern(cst: CST.Pattern): Model.Pattern {
  const body: Model.Pattern['body'] = cst.body.map(el =>
    el.type === 'text' ? el.value : asExpression(el, true)
  );
  return { body };
}

function asExpression(
  cst: CST.Expression | CST.Junk,
  allowMarkup: false
): Model.Expression;
function asExpression(
  cst: CST.Expression | CST.Junk,
  allowMarkup: true
): Model.Expression | Model.Markup;
function asExpression(
  cst: CST.Expression | CST.Junk,
  allowMarkup: boolean
): Model.Expression | Model.Markup {
  if (cst.type === 'expression') {
    if (allowMarkup && cst.markup) {
      const cm = cst.markup;
      const name = asName(cm.name);
      if (cm.type === 'markup-close') {
        return { type: 'markup', kind: 'close', name };
      }
      const markup: Model.MarkupOpen | Model.MarkupStandalone = {
        type: 'markup',
        kind: cm.close ? 'standalone' : 'open',
        name
      };
      if (cm.options.length > 0) markup.options = cm.options.map(asOption);
      return markup;
    }

    const arg = cst.arg ? asValue(cst.arg) : undefined;
    let annotation:
      | Model.FunctionAnnotation
      | Model.UnsupportedAnnotation
      | undefined;

    const ca = cst.annotation;
    if (ca) {
      switch (ca.type) {
        case 'function':
          annotation = { type: 'function', name: asName(ca.name) };
          if (ca.options.length > 0) {
            annotation.options = ca.options.map(asOption);
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

const asOption = (cst: CST.Option): Model.Option => ({
  name: asName(cst.name),
  value: asValue(cst.value)
});

function asName(cst: CST.Identifier): string {
  switch (cst.length) {
    case 1:
      return cst[0].value;
    case 3:
      return `${cst[0].value}:${cst[2].value}`;
    default:
      throw new MessageSyntaxError(
        'parse-error',
        cst[0]?.start ?? -1,
        cst.at(-1)?.end ?? -1
      );
  }
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
