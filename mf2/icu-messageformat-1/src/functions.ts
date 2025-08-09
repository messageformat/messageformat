import { MessageFunctionError } from 'messageformat';
import {
  DefaultFunctions,
  DraftFunctions,
  type MessageDateTime,
  type MessageFunctionContext,
  type MessageNumber,
  type MessageValue
} from 'messageformat/functions';

function checkArgStyle(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>
) {
  const argStyle = options['mf1:argStyle'];
  if (argStyle) {
    const msg = `Unsupported MF1 number argStyle: ${argStyle}`;
    ctx.onError(new MessageFunctionError('bad-option', msg, ctx.source));
  }
}

function currency(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
): MessageNumber {
  checkArgStyle(ctx, options);
  const scale = Number(options['mf1:scale']);
  if (scale && scale !== 1) operand = scale * Number(operand);
  return DraftFunctions.currency(ctx, options, operand);
}

function date(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
): MessageDateTime {
  checkArgStyle(ctx, options);
  return DraftFunctions.date(ctx, options, operand);
}

function time(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
): MessageDateTime {
  checkArgStyle(ctx, options);
  return DraftFunctions.time(ctx, options, operand);
}

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

function number(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
): MessageNumber {
  checkArgStyle(ctx, options);
  const scale = Number(options['mf1:scale']);
  if (scale && scale !== 1) operand = scale * Number(operand);
  return DefaultFunctions.number(ctx, options, operand);
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
    const msg = `Plural offset must be an integer: ${options.offset}`;
    ctx.onError(new MessageFunctionError('bad-option', msg, ctx.source));
  }

  const mv = DefaultFunctions.number(ctx, {}, num);
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

function unit(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  operand?: unknown
): MessageNumber {
  checkArgStyle(ctx, options);
  const scale = Number(options['mf1:scale']);
  if (scale && scale !== 1) operand = scale * Number(operand);
  return DraftFunctions.unit(ctx, options, operand);
}

/**
 * Function handlers for ICU MessageFormat 1.
 *
 * Used by {@link mf1ToMessage}.
 */
export let MF1Functions = {
  /**
   * A wrapper around {@link DraftFunctions.currency},
   * used for formatting a `number, currency` and `number, ::currency` placeholder.
   */
  'mf1:currency': currency,

  /**
   * A wrapper around {@link DraftFunctions.date},
   * used for formatting `date` placeholders.
   */
  'mf1:date': date,

  /**
   * A wrapper around {@link DraftFunctions.time},
   * used for formatting `time` placeholders.
   */
  'mf1:time': time,

  /**
   * Formats a duration expressed as seconds.
   *
   * The formatted value includes one or two `:` separators,
   * matching the pattern `hhhh:mm:ss`,
   * possibly with a leading `-` for negative values and a trailing `.sss` part for non-integer input.
   */
  'mf1:duration': duration,

  /**
   * A wrapper around {@link DefaultFunctions.number},
   * used for formatting most `number` placeholders.
   */
  'mf1:number': number,

  /**
   * A plural or selectordinal selector that includes an `offset`.
   *
   * Selectors without an offset are represented by `:number`.
   */
  'mf1:plural': plural,

  /**
   * A wrapper around {@link DraftFunctions.unit},
   * used for formatting `number, percent`, `number, ::unit`, and other placeholders.
   */
  'mf1:unit': unit
};
MF1Functions = Object.freeze(Object.assign(Object.create(null), MF1Functions));
