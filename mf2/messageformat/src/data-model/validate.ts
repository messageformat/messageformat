import { MessageDataModelError } from '../errors.ts';
import type { Message, Node, VariableRef, Variant } from './types.ts';
import { visit } from './visit.ts';

/**
 * Ensure that the `msg` data model is _valid_, calling `onError` on errors.
 * If `onError` is not defined, a {@link MessageDataModelError} will be thrown on error.
 *
 * Detects the following errors:
 *
 * - `'key-mismatch'`: **Variant Key Mismatch**<br>
 *   The number of keys on a _variant_ does not equal the number of _selectors_.
 *
 * - `'missing-fallback'`: **Missing Fallback Variant**<br>
 *   The message does not include a _variant_ with only catch-all keys.
 *
 * - `'missing-selector-annotation'`: **Missing Selector Annotation**<br>
 *   A _selector_ does not contains a _variable_ that directly or indirectly
 *   reference a _declaration_ with a _function_.
 *
 * - `'duplicate-declaration'`: **Duplicate Declaration**<br>
 *   A _variable_ appears in two _declarations_.
 *
 * - `'duplicate-variant'`: **Duplicate Variant**<br>
 *   The same list of _keys_ is used for more than one _variant_.
 *
 * @category Message Data Model
 * @returns The sets of runtime `functions` and `variables` used by the message.
 */
export function validate(
  msg: Message,
  onError: (type: MessageDataModelError['type'], node: Node) => void = (
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
        decl.value.functionRef ||
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

    expression({ functionRef }) {
      if (functionRef) functions.add(functionRef.name);
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
