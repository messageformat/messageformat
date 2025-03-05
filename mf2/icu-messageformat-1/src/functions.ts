import {
  DraftFunctions,
  type MessageDateTime,
  type MessageFunctionContext,
  type MessageNumber,
  type MessageValue,
  getLocaleDir
} from 'messageformat/functions';

function getParam(options: Record<string, unknown>) {
  if (options.param) {
    const param = String(options.param).trim();
    if (param) return param;
  }
  return undefined;
}

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

function date(
  msgCtx: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
): MessageDateTime {
  const size = getParam(options) as DateTimeSize;
  const opt = {
    weekday: size === 'full' ? 'long' : undefined,
    day: 'numeric',
    month:
      size === 'short'
        ? 'numeric'
        : size === 'full' || size === 'long'
          ? 'long'
          : 'short',
    year: 'numeric'
  };
  return DraftFunctions.datetime(msgCtx, opt, input);
}

function time(
  msgCtx: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
): MessageDateTime {
  const size = getParam(options) as DateTimeSize;
  const opt = {
    second: size === 'short' ? undefined : 'numeric',
    minute: 'numeric',
    hour: 'numeric',
    timeZoneName: size === 'full' || size === 'long' ? 'short' : undefined
  };
  return DraftFunctions.datetime(msgCtx, opt, input);
}

/**
 * Represent a duration in seconds as a string
 *
 * @returns Includes one or two `:` separators, and matches the pattern
 *   `hhhh:mm:ss`, possibly with a leading `-` for negative values and a
 *   trailing `.sss` part for non-integer input
 */
function duration(
  { source }: MessageFunctionContext,
  _options: unknown,
  input?: unknown
) {
  let value = Number(input);
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

  return {
    type: 'mf1-duration' as const,
    source,
    toParts() {
      const res = { type: 'mf1-duration' as const, source, value: str };
      return [res] as [typeof res];
    },
    toString: () => str,
    valueOf: () => value
  } satisfies MessageValue;
}

function number(
  ctx: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
): MessageNumber {
  const { locales, source } = ctx;
  const origNum = typeof input === 'bigint' ? input : Number(input);
  let num = origNum;
  const offset = Number(options.pluralOffset);
  if (Number.isInteger(offset)) {
    if (typeof num === 'number') num -= offset;
    else if (typeof num === 'bigint') num -= BigInt(offset);
  }

  const opt: Intl.NumberFormatOptions & Intl.PluralRulesOptions = {
    localeMatcher: ctx.localeMatcher
  };
  switch (getParam(options)) {
    case 'integer':
      opt.maximumFractionDigits = 0;
      break;
    case 'percent':
      opt.style = 'percent';
      break;
    case 'currency': {
      opt.style = 'currency';
      opt.currency = 'USD';
      break;
    }
  }
  if (options.type === 'ordinal') opt.type = 'ordinal';

  let locale: string | undefined;
  let dir = ctx.dir;
  let nf: Intl.NumberFormat | undefined;
  let cat: Intl.LDMLPluralRule | undefined;
  let str: string | undefined;
  return {
    type: 'number',
    source,
    get dir() {
      if (dir == null) {
        locale ??= Intl.NumberFormat.supportedLocalesOf(locales, opt)[0];
        dir = getLocaleDir(locale);
      }
      return dir;
    },
    get options() {
      return { ...opt };
    },
    selectKey(keys) {
      const str = String(origNum);
      if (keys.has(str)) return str;
      // Intl.PluralRules needs a number, not bigint
      cat ??= new Intl.PluralRules(locales, opt).select(Number(num));
      return keys.has(cat) ? cat : null;
    },
    toParts() {
      nf ??= new Intl.NumberFormat(locales, opt);
      const parts = nf.formatToParts(num);
      locale ??= nf.resolvedOptions().locale;
      dir ??= getLocaleDir(locale);
      return dir === 'ltr' || dir === 'rtl'
        ? [{ type: 'number', source, dir, locale, parts }]
        : [{ type: 'number', source, locale, parts }];
    },
    toString() {
      nf ??= new Intl.NumberFormat(locales, opt);
      str ??= nf.format(num);
      return str;
    },
    valueOf: () => num
  };
}

/**
 * Build a {@link messageformat#MessageFormat} runtime to use with ICU MessageFormat 1 messages.
 *
 * The structure of this runtime and the options available for its formatters
 * follow the MF1 specifications, rather than being based on the MF2 default runtime.
 */
export const getMF1Functions = () => ({
  'mf1:date': date,
  'mf1:duration': duration,
  'mf1:number': number,
  'mf1:time': time
});
