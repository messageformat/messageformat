import { MessageResolutionError } from '../errors.js';
import type { Context } from '../format-context.js';
import { fallback } from '../runtime/index.js';
import type { Literal } from './literal.js';
import { getValueSource } from './value.js';
import type { VariableRef } from './variable-ref.js';

/**
 * When the parser encounters an expression with syntax reserved for later use,
 * it emits a Reserved pattern element to represent it.
 *
 * @remarks
 * As the meaning of this syntax is not yet defined or supported,
 * it will always resolve with a fallback representation and emit an error.
 *
 * @beta
 */
export interface Reserved {
  type: 'reserved';
  sigil: '!' | '@' | '#' | '%' | '^' | '&' | '*' | '<' | '>' | '?' | '~';
  source: string;
  name?: never;
  operand?: Literal | VariableRef;
}

/**
 * Type guard for {@link Reserved} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isReserved = (part: any): part is Reserved =>
  !!part && typeof part === 'object' && part.type === 'reserved';

export function resolveReserved(
  ctx: Context,
  { operand, sigil, source }: Reserved
) {
  const msg = `Reserved ${sigil} expression is not supported`;
  ctx.onError(new MessageResolutionError('reserved', msg, source));
  return fallback(getValueSource(operand) ?? source);
}
