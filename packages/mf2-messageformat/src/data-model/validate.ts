import type { MessageDataModelError } from '../errors.js';
import type {
  Declaration,
  Expression,
  Literal,
  Message,
  Option,
  VariableRef,
  Variant
} from './types.js';
import { visit } from './visit.js';

/**
 * Ensure that the `msg` data model is _valid_, calling `onError` on errors.
 *
 * @remarks
 * Detects the following errors:
 *
 * - **Variant Key Mismatch**:
 *   The number of keys on a _variant_ does not equal the number of _selectors_.
 *
 * - **Missing Fallback Variant**:
 *   The message does not include a _variant_ with only catch-all keys.
 *
 * - **Missing Selector Annotation**:
 *   A _selector_ does not have an _annotation_,
 *   or contains a _variable_ that does not directly or indirectly
 *   reference a _declaration_ with an _annotation_.
 *
 * - **Duplicate Declaration**:
 *   A _variable_ appears in two _declarations_.
 *
 * - **Invalid Forward Reference**:
 *   A _declaration_ _expression_ refers to a _variable_ defined by a later _declaration_.
 *
 * - **Duplicate Option Name**:
 *   The same _identifier_ appears as the name of more than one _option_ in the same _expression_.
 *
 * @returns The sets of runtime `functions` and `variables` used by the message.
 * @beta
 */
export function validate(
  msg: Message,
  onError: (
    type: MessageDataModelError['type'],
    node: Message | Declaration | Expression | Option | VariableRef | Variant
  ) => void
) {
  const annotated = new Set<string>();
  const declared = new Set<string>();
  let selectorCount = 0;
  let missingFallback = false;

  const declRefs = new Map<string, VariableRef[]>();
  const addDeclarationRef = (ref: Literal | VariableRef | undefined) => {
    if (ref?.type === 'variable') {
      const prev = declRefs.get(ref.name);
      if (prev) prev.push(ref);
      else declRefs.set(ref.name, [ref]);
    }
  };

  const functions = new Set<string>();
  const localVars = new Set<string>();
  const variables = new Set<string>();

  const visitOptions = (
    options: Option[] | undefined,
    context: 'declaration' | 'selector' | 'placeholder'
  ) => {
    if (options) {
      for (let i = 0; i < options.length; ++i) {
        const { name, value } = options[i];
        for (let j = i + 1; j < options.length; ++j) {
          if (options[j].name === name) onError('duplicate-option', options[j]);
        }
        if (value.type === 'variable') {
          variables.add(value.name);
          if (context === 'declaration') addDeclarationRef(value);
        }
      }
    }
  };

  visit(msg, {
    declaration(decl) {
      if (decl.name) {
        if (declared.has(decl.name)) onError('duplicate-declaration', decl);
        else declared.add(decl.name);

        for (const ref of declRefs.get(decl.name) ?? []) {
          if (decl.type !== 'input' || ref !== decl.value.arg) {
            onError('forward-reference', ref);
          }
        }

        if (
          decl.value.annotation ||
          (decl.type === 'local' &&
            decl.value.arg?.type === 'variable' &&
            annotated.has(decl.value.arg.name))
        ) {
          annotated.add(decl.name);
        }

        if (decl.type === 'local') localVars.add(decl.name);
      }
    },

    expression(expression, context) {
      const { arg, annotation } = expression;
      visitOptions(annotation?.options, context);

      if (annotation?.type === 'function') functions.add(annotation.name);

      switch (context) {
        case 'declaration': {
          addDeclarationRef(arg);
          break;
        }

        case 'selector':
          selectorCount += 1;
          missingFallback = true;
          if (
            !annotation &&
            (arg?.type !== 'variable' || !annotated.has(arg.name))
          ) {
            onError('missing-selector-annotation', expression);
          }
          break;
      }
    },

    markup({ options }, context) {
      visitOptions(options, context);
    },

    variant(variant) {
      const { keys } = variant;
      if (keys.length !== selectorCount) onError('key-mismatch', variant);
      if (missingFallback && keys.every(key => key.type === '*')) {
        missingFallback = false;
      }
    }
  });

  if (missingFallback) onError('missing-fallback', msg);

  for (const lv of localVars) variables.delete(lv);

  return { functions, variables };
}
