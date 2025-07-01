import {
  type Model as MF,
  MessageFunctionError,
  MessageResolutionError,
  visit
} from 'messageformat';
import { DefaultFunctions } from 'messageformat/functions';
import { MF1Functions } from './functions.ts';

/**
 * Ensure that the `msg` data model does not contain any unsupported MF1 argType or argStyle references,
 * calling `onError` on errors.
 * If `onError` is not defined, errors will be thrown.
 */
export function mf1Validate(
  msg: MF.Message,
  onError: (
    type: 'unknown-function' | 'unsupported-operation',
    expr: MF.Expression
  ) => void = (type, expr) => {
    const argTypeAttr = expr.attributes?.get('mf1:argType');
    const argType =
      argTypeAttr && argTypeAttr !== true
        ? argTypeAttr.value
        : expr.functionRef!.name.replace('mf1:', '');
    if (type === 'unknown-function') {
      throw new MessageResolutionError(
        type,
        `Unsupported MF1 argType: ${argType}`,
        argType
      );
    } else {
      const opt = expr.functionRef!.options!.get('mf1:argStyle')!;
      const argStyle = opt?.type === 'literal' ? opt.value : '�';
      throw new MessageFunctionError(
        type,
        `Unsupported MF1 ${argType} argStyle: ${argStyle}`,
        argStyle
      );
    }
  }
) {
  visit(msg, {
    expression(expr) {
      if (expr.functionRef) {
        const name = expr.functionRef.name;
        if (!(name in DefaultFunctions) && !(name in MF1Functions)) {
          onError('unknown-function', expr);
        }
        if (expr.functionRef.options?.has('mf1:argStyle')) {
          onError('unsupported-operation', expr);
        }
      }
    }
  });
}
