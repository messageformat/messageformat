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
    const argTypeAttr =
      expr.attributes && Object.hasOwn(expr.attributes, 'mf1:argType')
        ? expr.attributes['mf1:argType']
        : undefined;
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
      const msg = `Unsupported MF1 ${argType} argStyle`;
      const opt = expr.functionRef!.options!['mf1:argStyle'];
      if (opt?.type === 'literal') {
        const error = new MessageFunctionError(type, `${msg}: ${opt.value}`);
        error.source = opt.value;
        throw error;
      } else {
        throw new MessageFunctionError(type, msg);
      }
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
        if (expr.functionRef.options?.['mf1:argStyle'] !== undefined) {
          onError('unsupported-operation', expr);
        }
      }
    }
  });
}
