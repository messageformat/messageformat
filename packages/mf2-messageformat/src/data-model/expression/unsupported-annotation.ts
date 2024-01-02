import { MessageResolutionError } from '../../errors.js';
import type { Context } from '../../format-context.js';
import { fallback } from '../../runtime/index.js';
import type { Literal } from './literal.js';
import { getValueSource } from './value.js';
import type { VariableRef } from './variable-ref.js';

/**
 * When the parser encounters an expression with reserved syntax,
 * it emits an UnsupportedAnnotation to represent it.
 *
 * @remarks
 * As the meaning of this syntax is not supported,
 * it will always resolve with a fallback representation and emit an error.
 *
 * @beta
 */
export interface UnsupportedAnnotation {
  type: 'unsupported-annotation';
  sigil: '!' | '@' | '#' | '%' | '^' | '&' | '*' | '<' | '>' | '?' | '~' | '�';
  source: string;
  name?: never;
}

export function resolveUnsupportedAnnotation(
  ctx: Context,
  operand: Literal | VariableRef | undefined,
  { sigil = '�' }: UnsupportedAnnotation
) {
  const msg = `Reserved ${sigil} annotation is not supported`;
  ctx.onError(new MessageResolutionError('unsupported-annotation', msg, sigil));
  return fallback(getValueSource(operand) ?? sigil);
}
