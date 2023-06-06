import { MessageError } from '../errors.js';
import type { Context } from '../format-context.js';
import { MessageFallback } from '../message-value/index.js';
import { FALLBACK_SOURCE } from '../message-value/message-value';
import type { Literal } from './literal.js';
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
  if (operand) {
    const arg = ctx.resolve(operand);
    source =
      arg.source ||
      String((arg.type === 'literal' && arg.value) || FALLBACK_SOURCE);
  }
  const fb = new MessageFallback(ctx, { source });
  ctx.onError(
    new MessageError(
      'reserved',
      `Reserved ${sigil} expression is not supported`
    ),
    fb
  );
  return fb;
}
