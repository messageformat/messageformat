import { MessageError, MessageFunctionError } from '../errors.ts';
import type { MessageFunctionContext } from './index.ts';
import type { MessageNumber, MessageNumberOptions } from './number.ts';
import { getMessageNumber, readNumericOperand } from './number.ts';
import { asPositiveInteger, asString } from './utils.ts';

/**
 * `unit` accepts as input numerical values as well as
 * objects wrapping a numerical value that also include a `unit` property.
 *
 * @beta
 */
export function unit(
  ctx: MessageFunctionContext,
  exprOpt: Record<string | symbol, unknown>,
  operand?: unknown
): MessageNumber {
  const input = readNumericOperand(operand, ctx.source);
  const options: MessageNumberOptions = Object.assign({}, input.options, {
    localeMatcher: ctx.localeMatcher,
    style: 'unit'
  } as const);

  for (const [name, optval] of Object.entries(exprOpt)) {
    if (optval === undefined) continue;
    try {
      switch (name) {
        case 'signDisplay':
        case 'roundingMode':
        case 'roundingPriority':
        case 'trailingZeroDisplay':
        case 'unit':
        case 'unitDisplay':
        case 'useGrouping':
          // @ts-expect-error Let Intl.NumberFormat construction fail
          options[name] = asString(optval);
          break;
        case 'minimumIntegerDigits':
        case 'minimumFractionDigits':
        case 'maximumFractionDigits':
        case 'minimumSignificantDigits':
        case 'maximumSignificantDigits':
        case 'roundingIncrement':
          // @ts-expect-error TS types don't know about roundingIncrement
          options[name] = asPositiveInteger(optval);
          break;
      }
    } catch (error) {
      if (error instanceof MessageError) {
        ctx.onError(error);
      } else {
        const msg = `Value ${optval} is not valid for :currency option ${name}`;
        ctx.onError(new MessageFunctionError('bad-option', msg, ctx.source));
      }
    }
  }

  if (!options.unit) {
    const msg = 'A unit identifier is required for :unit';
    throw new MessageFunctionError('bad-operand', msg, ctx.source);
  }

  return getMessageNumber(ctx, input.value, options, false);
}
