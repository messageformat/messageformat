import { MessageFunctionError } from '../errors.ts';
import type { MessageFunctionContext } from './index.ts';
import { MessageNumber, number, readNumericOperand } from './number.ts';
import { asPositiveInteger } from './utils.ts';

/**
 * `offset` accepts a numeric value as input and adds or subtracts an integer value from it
 *
 * @beta
 */
export function offset(
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
    throw new MessageFunctionError('bad-option', String(error), source);
  }
  if (add < 0 === sub < 0) {
    const msg =
      'Exactly one of "add" or "subtract" is required as an :offset option';
    throw new MessageFunctionError('bad-option', msg, source);
  }
  const delta = add < 0 ? -sub : add;
  if (typeof value === 'number') value += delta;
  else value += BigInt(delta);

  return number(ctx, {}, { valueOf: () => value, options });
}
