import type { MessageFunctionContext } from './index.ts';
import type { MessageNumber, MessageNumberOptions } from './number.ts';
import { getMessageNumber, readNumericOperand } from './number.ts';
import { asPositiveInteger, asString } from './utils.ts';

/**
 * The function `:percent` is a selector and formatter for percent values.
 *
 * @beta
 */
export function percent(
  ctx: MessageFunctionContext,
  exprOpt: Record<string | symbol, unknown>,
  operand?: unknown
): MessageNumber {
  const input = readNumericOperand(operand);
  const options: MessageNumberOptions = Object.assign({}, input.options, {
    localeMatcher: ctx.localeMatcher,
    style: 'percent'
  } as const);

  for (const [name, optval] of Object.entries(exprOpt)) {
    if (optval === undefined) continue;
    try {
      switch (name) {
        case 'roundingMode':
        case 'roundingPriority':
        case 'signDisplay':
        case 'trailingZeroDisplay':
        case 'useGrouping':
          // @ts-expect-error Let Intl.NumberFormat construction fail
          options[name] = asString(optval);
          break;
        case 'minimumFractionDigits':
        case 'maximumFractionDigits':
        case 'minimumSignificantDigits':
        case 'maximumSignificantDigits':
          options[name] = asPositiveInteger(optval);
          break;
      }
    } catch {
      ctx.onError(
        'bad-option',
        `Value ${optval} is not valid for :percent option ${name}`
      );
    }
  }

  return getMessageNumber(ctx, input.value, options, true);
}
