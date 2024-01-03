import type * as Model from './types.js';
import { MessageSyntaxError } from '../errors.js';
import type * as CST from '../cst-parser/cst-types.js';

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
      selectors: msg.selectors.map(sel => asExpression(sel, false)),
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

function asPattern(pattern: CST.Pattern): Model.Pattern {
  const body: Model.Pattern['body'] = pattern.body.map(el =>
    el.type === 'text' ? el.value : asExpression(el, true)
  );
  return { body };
}

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
      if (cm.type === 'markup-close') {
        return { type: 'markup', kind: 'close', name, [cst]: exp };
      }
      const markup: Model.MarkupOpen | Model.MarkupStandalone = {
        type: 'markup',
        kind: cm.close ? 'standalone' : 'open',
        name,
        [cst]: exp
      };
      if (cm.options.length > 0) markup.options = cm.options.map(asOption);
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
          annotation = { type: 'function', name: asName(ca.name), [cst]: ca };
          if (ca.options.length > 0) {
            annotation.options = ca.options.map(asOption);
          }

          break;
        case 'reserved-annotation':
          annotation = {
            type: 'unsupported-annotation',
            sigil: ca.sigil,
            source: ca.source.value,
            [cst]: ca
          };
          break;
        default:
          throw new MessageSyntaxError('parse-error', exp.start, exp.end);
      }
    }
    if (arg) {
      return annotation
        ? { type: 'expression', arg, annotation, [cst]: exp }
        : { type: 'expression', arg, [cst]: exp };
    } else if (annotation) {
      return { type: 'expression', annotation, [cst]: exp };
    }
  }
  throw new MessageSyntaxError('parse-error', exp.start, exp.end);
}

const asOption = (option: CST.Option): Model.Option => ({
  name: asName(option.name),
  value: asValue(option.value),
  [cst]: option
});

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
