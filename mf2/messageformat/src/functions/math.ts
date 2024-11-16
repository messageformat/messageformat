import { MessageResolutionError } from '../errors.js';
import type { MessageFunctionContext } from './index.js';
import { MessageNumber, number } from './number.js';
import { asPositiveInteger } from './utils.js';

/**
 * `math` accepts a numeric value as input and adds or subtracts an integer value from it
 *
 * @beta
 */
export function math(
  ctx: MessageFunctionContext,
  mathOpt: Record<string | symbol, unknown>,
  input?: unknown
): MessageNumber {
  const { source } = ctx;
  let options: unknown = undefined;
  let value = input;
  if (typeof value === 'object') {
    const valueOf = value?.valueOf;
    if (typeof valueOf === 'function') {
      options = (value as { options: unknown }).options;
      value = valueOf.call(value);
    }
  }
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      // handled below
    }
  }
  if (typeof value !== 'bigint' && typeof value !== 'number') {
    const msg = 'Input is not numeric';
    throw new MessageResolutionError('bad-operand', msg, source);
  }

  let add: number;
  let sub: number;
  try {
    add = 'add' in mathOpt ? asPositiveInteger(mathOpt.add) : -1;
    sub = 'subtract' in mathOpt ? asPositiveInteger(mathOpt.subtract) : -1;
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
