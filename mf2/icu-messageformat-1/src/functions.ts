import { MessageResolutionError } from 'messageformat';
import {
  DefaultFunctions,
  DraftFunctions,
  type MessageDateTime,
  type MessageFunctionContext,
  type MessageNumber,
  type MessageValue
} from 'messageformat/functions';

const currency: (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
) => MessageNumber = DraftFunctions.currency;

const datetime: (
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
) => MessageDateTime = DraftFunctions.datetime;

function duration(
  ctx: MessageFunctionContext,
  _options: unknown,
  operand?: unknown
) {
  let value = Number(operand);
  let str: string;
  if (!isFinite(value)) {
    str = String(value);
  } else {
    let sign = '';
    if (value < 0) {
      sign = '-';
      value = Math.abs(value);
    }
    const sec = value % 60;
    const parts = [Math.round(sec) === sec ? sec : sec.toFixed(3)];
    if (value < 60) {
      parts.unshift(0); // at least one : is required
    } else {
      value = Math.round((value - Number(parts[0])) / 60);
      parts.unshift(value % 60); // minutes
      if (value >= 60) {
        value = Math.round((value - Number(parts[0])) / 60);
        parts.unshift(value); // hours
      }
    }
    const first = parts.shift();
    str =
      sign +
      first +
      ':' +
      parts.map(n => (Number(n) < 10 ? '0' + String(n) : String(n))).join(':');
  }

  const { source } = ctx;
  return {
    type: 'mf1:duration',
    source,
    toParts: () => [{ type: 'mf1:duration', source, value: str }] as const,
    toString: () => str,
    valueOf: () => value
  } satisfies MessageValue<'mf1:duration'>;
}

function percent(
  ctx: MessageFunctionContext,
  _options: Record<string, unknown>,
  operand?: unknown
): MessageNumber {
  return DraftFunctions.unit(ctx, { unit: 'percent' }, 100 * Number(operand));
}

function plural(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
): MessageNumber {
  const origNum = typeof operand === 'bigint' ? operand : Number(operand);
  let num = origNum;
  const offset = Number(options.offset);
  if (Number.isInteger(offset)) {
    if (typeof num === 'number') num -= offset;
    else if (typeof num === 'bigint') num -= BigInt(offset);
  } else {
    ctx.onError(
      new MessageResolutionError(
        'bad-option',
        `Plural offset must be an integer: ${options.offset}`,
        ctx.source
      )
    );
  }

  const mv = DefaultFunctions.number(ctx, options, num);
  mv.selectKey = keys => {
    const str = String(origNum);
    if (keys.has(str)) return str;
    // Intl.PluralRules needs a number, not bigint
    const cat = new Intl.PluralRules(ctx.locales, {
      localeMatcher: ctx.localeMatcher,
      type: options.select === 'ordinal' ? 'ordinal' : 'cardinal'
    }).select(Number(num));
    return keys.has(cat) ? cat : null;
  };
  return mv;
}

/**
 * Function handlers for ICU MessageFormat 1.
 *
 * Used by {@link mf1ToMessage}.
 */
export let MF1Functions = {
  /**
   * A re-export of {@link DraftFunctions.currency},
   * used for formatting a `number, currency` placeholder.
   *
   * Note that the currency code is set to `"XXX"`.
   */
  currency,

  /**
   * A re-export of {@link DraftFunctions.datetime},
   * used for formatting `date` and `time` placeholders.
   */
  datetime,

  /**
   * Formats a duration expressed as seconds.
   *
   * The formatted value includes one or two `:` separators,
   * matching the pattern `hhhh:mm:ss`,
   * possibly with a leading `-` for negative values and a trailing `.sss` part for non-integer input.
   */
  'mf1:duration': duration,

  /**
   * A wrapper around {@link DraftFunctions.unit},
   * used for formatting a `number, percent` placeholder.
   */
  'mf1:percent': percent,

  /**
   * A plural or selectordinal selector that includes an `offset`.
   *
   * Selectors without an offset are represented by `:number`.
   */
  'mf1:plural': plural
};
MF1Functions = Object.freeze(Object.assign(Object.create(null), MF1Functions));
