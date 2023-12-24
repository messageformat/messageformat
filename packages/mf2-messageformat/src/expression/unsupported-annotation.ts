import { MessageResolutionError } from '../errors.js';
import type { Context } from '../format-context.js';
import { fallback } from '../runtime/index.js';
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
  sigil: '!' | '@' | '#' | '%' | '^' | '&' | '*' | '<' | '>' | '?' | '~';
  source: string;
  name?: never;
  operand?: Literal | VariableRef;
}

/**
 * Type guard for {@link UnsupportedAnnotation} pattern elements
 *
 * @beta
 */
export const isUnsupportedAnnotation = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  part: any
): part is UnsupportedAnnotation =>
  !!part && typeof part === 'object' && part.type === 'unsupported-annotation';

export function resolveunsupportedAnnotation(
  ctx: Context,
  { operand, sigil, source }: UnsupportedAnnotation
) {
  const msg = `Reserved ${sigil} annotation is not supported`;
  ctx.onError(
    new MessageResolutionError('unsupported-annotation', msg, source)
  );
  return fallback(getValueSource(operand) ?? source);
}
