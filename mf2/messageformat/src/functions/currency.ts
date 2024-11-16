import { MessageError, MessageResolutionError } from '../errors.js';
import type { MessageFunctionContext } from './index.js';
import { type MessageNumber, number } from './number.js';
import { asPositiveInteger, asString } from './utils.js';

/**
 * `currency` accepts as input numerical values as well as
 * objects wrapping a numerical value that also include a `currency` property.
 *
 * @beta
 */
export function currency(
  ctx: MessageFunctionContext,
  exprOpt: Record<string | symbol, unknown>,
  input?: unknown
): MessageNumber {
  const { source } = ctx;
  const options: Intl.NumberFormatOptions &
    Intl.PluralRulesOptions & { select?: 'exact' | 'cardinal' } = {
    localeMatcher: ctx.localeMatcher
  };
  let value = input;
  if (typeof value === 'object') {
    const valueOf = value?.valueOf;
    if (typeof valueOf === 'function') {
      Object.assign(options, (value as { options: unknown }).options);
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

  options.style = 'currency';
  for (const [name, optval] of Object.entries(exprOpt)) {
    if (optval === undefined) continue;
    try {
      switch (name) {
        case 'compactDisplay':
        case 'currency':
        case 'currencySign':
        case 'notation':
        case 'numberingSystem':
        case 'roundingMode':
        case 'roundingPriority':
        case 'trailingZeroDisplay':
          // @ts-expect-error Let Intl.NumberFormat construction fail
          options[name] = asString(optval);
          break;
        case 'minimumIntegerDigits':
        case 'minimumSignificantDigits':
        case 'maximumSignificantDigits':
        case 'roundingIncrement':
          // @ts-expect-error TS types don't know about roundingIncrement
          options[name] = asPositiveInteger(optval);
          break;
        case 'currencyDisplay': {
          const strval = asString(optval);
          if (strval === 'formalSymbol' || strval === 'never') {
            throw new MessageResolutionError(
              'unsupported-operation',
              `Currency display "${strval}" is not supported on :currency`,
              source
            );
          }
          options[name] = strval;
          break;
        }
        case 'fractionDigits': {
          const strval = asString(optval);
          if (strval === 'auto') {
            options.minimumFractionDigits = undefined;
            options.maximumFractionDigits = undefined;
          } else {
            const numval = asPositiveInteger(strval);
            options.minimumFractionDigits = numval;
            options.maximumFractionDigits = numval;
          }
          break;
        }
        case 'select': {
          const strval = asString(optval);
          if (strval === 'ordinal') {
            throw new MessageResolutionError(
              'bad-option',
              'Ordinal selection is not supported on :currency',
              source
            );
          }
          // @ts-expect-error Let Intl.NumberFormat construction fail
          options[name] = strval;
          break;
        }
        case 'useGrouping': {
          const strval = asString(optval);
          // @ts-expect-error TS type is wrong
          options[name] = strval === 'never' ? false : strval;
          break;
        }
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

  if (!options.currency) {
    const msg = 'A currency code is required for :currency';
    throw new MessageResolutionError('bad-operand', msg, source);
  }

  return number(ctx, {}, { valueOf: () => value, options });
}
