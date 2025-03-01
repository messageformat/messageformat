import { MessageError, MessageResolutionError } from '../errors.js';
import type { MessageFunctionContext } from './index.js';
import type { MessageNumber, MessageNumberOptions } from './number.js';
import { getMessageNumber, readNumericOperand } from './number.js';
import { asPositiveInteger, asString } from './utils.js';

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
  const { source } = ctx;
  const input = readNumericOperand(operand, source);
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
        ctx.onError(new MessageResolutionError('bad-option', msg, source));
      }
    }
  }

  if (!options.unit) {
    const msg = 'A unit identifier is required for :unit';
    throw new MessageResolutionError('bad-operand', msg, source);
  }

  return getMessageNumber(ctx, input.value, options, false);
}
