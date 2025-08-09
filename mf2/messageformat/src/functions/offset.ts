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
  let { value, options } = readNumericOperand(operand);

  let add: number;
  try {
    add = 'add' in exprOpt ? asPositiveInteger(exprOpt.add) : -1;
  } catch {
    throw new MessageFunctionError(
      'bad-option',
      `Value ${exprOpt.add} is not valid for :offset option add`
    );
  }

  let sub: number;
  try {
    sub = 'subtract' in exprOpt ? asPositiveInteger(exprOpt.subtract) : -1;
  } catch {
    throw new MessageFunctionError(
      'bad-option',
      `Value ${exprOpt.subtract} is not valid for :offset option subtract`
    );
  }

  if (add < 0 === sub < 0) {
    const msg =
      'Exactly one of "add" or "subtract" is required as an :offset option';
    throw new MessageFunctionError('bad-option', msg);
  }
  const delta = add < 0 ? -sub : add;
  if (typeof value === 'number') value += delta;
  else value += BigInt(delta);

  return number(ctx, {}, { valueOf: () => value, options });
}
