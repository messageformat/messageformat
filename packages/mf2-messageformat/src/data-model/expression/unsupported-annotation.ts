import { MessageResolutionError } from '../../errors.js';
import type { Context } from '../../format-context.js';
import { fallback } from '../../runtime/index.js';
import type { Literal, UnsupportedAnnotation, VariableRef } from '../types.js';
import { getValueSource } from './value.js';

export function resolveUnsupportedAnnotation(
  ctx: Context,
  operand: Literal | VariableRef | undefined,
  { sigil = '�' }: UnsupportedAnnotation
) {
  const msg = `Reserved ${sigil} annotation is not supported`;
  ctx.onError(new MessageResolutionError('unsupported-annotation', msg, sigil));
  return fallback(getValueSource(operand) ?? sigil);
}
