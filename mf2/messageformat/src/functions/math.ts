import { MessageResolutionError } from '../errors.ts';
import type { MessageFunctionContext } from './index.ts';
import type { MessageNumber } from './number.ts';
import { number, readNumericOperand } from './number.ts';
import { asPositiveInteger } from './utils.ts';

/**
 * `math` accepts a numeric value as input and adds or subtracts an integer value from it
 *
 * @beta
 */
export function math(
  ctx: MessageFunctionContext,
  exprOpt: Record<string | symbol, unknown>,
  operand?: unknown
): MessageNumber {
  const { source } = ctx;
  let { value, options } = readNumericOperand(operand, source);

  let add: number;
  let sub: number;
  try {
    add = 'add' in exprOpt ? asPositiveInteger(exprOpt.add) : -1;
    sub = 'subtract' in exprOpt ? asPositiveInteger(exprOpt.subtract) : -1;
  } catch (error) {
    throw new MessageResolutionError('bad-option', String(error), source);
  }
  if (add < 0 === sub < 0) {
    const msg =
      'Exactly one of "add" or "subtract" is required as a :math option';
    throw new MessageResolutionError('bad-option', msg, source);
  }
  const delta = add < 0 ? -sub : add;
  if (typeof value === 'number') value += delta;
  else value += BigInt(delta);

  return number(ctx, {}, { valueOf: () => value, options });
}
