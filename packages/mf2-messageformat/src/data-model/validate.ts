import { MessageDataModelError } from '../errors.js';
import type {
  Expression,
  Message,
  MessageNode,
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
  onError: (type: MessageDataModelError['type'], node: MessageNode) => void = (
    type,
    node
  ) => {
    throw new MessageDataModelError(type, node);
  }
) {
  let selectorCount = 0;
  let missingFallback: Expression | Variant | null = null;

  /** Tracks directly & indirectly annotated variables for `missing-selector-annotation` */
  const annotated = new Set<string>();

  /** Tracks declared variables for `duplicate-declaration` */
  const declared = new Set<string>();

  const declRefs = new Map<string, VariableRef[]>();
  const functions = new Set<string>();
  const localVars = new Set<string>();
  const variables = new Set<string>();

  visit(msg, {
    declaration(decl) {
      // Skip all ReservedStatement
      if (!decl.name) return undefined;

      if (declared.has(decl.name)) onError('duplicate-declaration', decl);
      else declared.add(decl.name);

      if (
        decl.value.annotation ||
        (decl.type === 'local' &&
          decl.value.arg?.type === 'variable' &&
          annotated.has(decl.value.arg.name))
      ) {
        annotated.add(decl.name);
      }

      if (decl.type === 'local') localVars.add(decl.name);

      return () => {
        for (const ref of declRefs.get(decl.name) ?? []) {
          if (decl.type !== 'input' || ref !== decl.value.arg) {
            onError('forward-reference', ref);
          }
        }
      };
    },

    expression(expression, context) {
      const { arg, annotation } = expression;
      if (annotation?.type === 'function') functions.add(annotation.name);
      if (context === 'selector') {
        selectorCount += 1;
        missingFallback = expression;
        if (
          !annotation &&
          (arg?.type !== 'variable' || !annotated.has(arg.name))
        ) {
          onError('missing-selector-annotation', expression);
        }
      }
    },

    option({ name }, index, options) {
      for (let j = index + 1; j < options.length; ++j) {
        if (options[j].name === name) {
          onError('duplicate-option', options[j]);
          break;
        }
      }
    },

    value(value, context) {
      if (value.type === 'variable') {
        variables.add(value.name);
        if (context === 'declaration') {
          const prev = declRefs.get(value.name);
          if (prev) prev.push(value);
          else declRefs.set(value.name, [value]);
        }
      }
    },

    variant(variant) {
      const { keys } = variant;
      if (keys.length !== selectorCount) onError('key-mismatch', variant);
      missingFallback &&= keys.every(key => key.type === '*') ? null : variant;
    }
  });

  if (missingFallback) onError('missing-fallback', missingFallback);

  for (const lv of localVars) variables.delete(lv);

  return { functions, variables };
}
