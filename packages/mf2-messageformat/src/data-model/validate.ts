import { MessageDataModelError } from '../errors.js';
import type { Message, MessageNode, VariableRef, Variant } from './types.js';
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
 * - **Duplicate Variant**:
 *   The same list of _keys_ is used for more than one _variant_.
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
  let missingFallback: VariableRef | Variant | null = null;

  /** Tracks directly & indirectly annotated variables for `missing-selector-annotation` */
  const annotated = new Set<string>();

  /** Tracks declared variables for `duplicate-declaration` */
  const declared = new Set<string>();

  const functions = new Set<string>();
  const localVars = new Set<string>();
  const variables = new Set<string>();
  const variants = new Set<string>();

  let setArgAsDeclared = true;
  visit(msg, {
    declaration(decl) {
      // Skip all ReservedStatement
      if (!decl.name) return undefined;

      if (
        decl.value.annotation ||
        (decl.type === 'local' &&
          decl.value.arg?.type === 'variable' &&
          annotated.has(decl.value.arg.name))
      ) {
        annotated.add(decl.name);
      }

      if (decl.type === 'local') localVars.add(decl.name);

      setArgAsDeclared = decl.type === 'local';
      return () => {
        if (declared.has(decl.name)) onError('duplicate-declaration', decl);
        else declared.add(decl.name);
      };
    },

    expression({ annotation }) {
      if (annotation?.type === 'function') functions.add(annotation.name);
    },

    value(value, context, position) {
      if (value.type !== 'variable') return;
      variables.add(value.name);
      switch (context) {
        case 'declaration':
          if (position !== 'arg' || setArgAsDeclared) {
            declared.add(value.name);
          }
          break;
        case 'selector':
          selectorCount += 1;
          missingFallback = value;
          if (!annotated.has(value.name)) {
            onError('missing-selector-annotation', value);
          }
      }
    },

    variant(variant) {
      const { keys } = variant;
      if (keys.length !== selectorCount) onError('key-mismatch', variant);
      const strKeys = JSON.stringify(
        keys.map(key => (key.type === 'literal' ? key.value : 0))
      );
      if (variants.has(strKeys)) onError('duplicate-variant', variant);
      else variants.add(strKeys);
      missingFallback &&= keys.every(key => key.type === '*') ? null : variant;
    }
  });

  if (missingFallback) onError('missing-fallback', missingFallback);

  for (const lv of localVars) variables.delete(lv);

  return { functions, variables };
}
