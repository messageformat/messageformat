import {
  extendLocaleContext,
  MessageDateTime,
  MessageNumber,
  MessageValue,
  RuntimeOptions
} from 'messageformat';

function getParam(options: RuntimeOptions) {
  if (options.param) {
    const param = String(options.param).trim();
    if (param) return param;
  }
  return undefined;
}

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

function date(locales: string[], options: RuntimeOptions, arg?: MessageValue) {
  let date: Date | MessageDateTime;
  if (!arg) date = new Date(NaN); // Invalid Date
  else if (arg instanceof MessageDateTime) date = arg;
  else if (typeof arg.value === 'number') date = new Date(arg.value);
  else date = new Date(String(arg.value));
  const size = getParam(options) as DateTimeSize;
  const opt: Intl.DateTimeFormatOptions = {
    localeMatcher: options.localeMatcher,
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
  return new MessageDateTime(locales, date, { options: opt });
}
Object.freeze(date);

/**
 * Represent a duration in seconds as a string
 *
 * @return Includes one or two `:` separators, and matches the pattern
 *   `hhhh:mm:ss`, possibly with a leading `-` for negative values and a
 *   trailing `.sss` part for non-integer input
 */
function duration(_locales: string[], _options: unknown, arg?: MessageValue) {
  let value = Number(arg?.value);
  if (!isFinite(value)) return String(value);
  let sign = '';
  if (value < 0) {
    sign = '-';
    value = Math.abs(value);
  } else {
    value = Number(value);
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
  return (
    sign +
    first +
    ':' +
    parts.map(n => (n < 10 ? '0' + String(n) : String(n))).join(':')
  );
}
Object.freeze(duration);

function getMF1Offset(
  opt: (MessageNumber['options'] & { pluralOffset?: number }) | undefined
) {
  return Number(opt?.pluralOffset ?? 0);
}

class MessageMF1Number extends MessageNumber {
  constructor(
    locale: ConstructorParameters<typeof MessageNumber>[0],
    number: ConstructorParameters<typeof MessageNumber>[1],
    opt: ConstructorParameters<typeof MessageNumber>[2]
  ) {
    const offset = getMF1Offset(opt?.options);
    if (offset) {
      if (number instanceof MessageNumber) {
        locale = extendLocaleContext(number.localeContext, locale);
        if (number.options)
          opt = { ...opt, options: { ...number.options, ...opt?.options } };
        number = number.value;
      }
      if (typeof number === 'number') number -= offset;
      else if (typeof number === 'bigint') number -= BigInt(offset);
    }
    super(locale, number, opt);
  }

  matchSelectKey(key: string) {
    let num = this.value;
    const offset = getMF1Offset(this.options);
    if (offset) {
      if (typeof num === 'bigint') num += BigInt(offset);
      else num += offset;
    }
    return (
      (/^[0-9]+$/.test(key) && key === String(num)) ||
      key === this.getPluralCategory()
    );
  }
}

function number(
  locales: string[],
  options: RuntimeOptions,
  arg?: MessageValue
) {
  const num = arg instanceof MessageNumber ? arg : Number(arg?.value);
  const opt: Intl.NumberFormatOptions &
    Intl.PluralRulesOptions & { pluralOffset?: number } = {};
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
  const offset = Number(options.pluralOffset);
  if (Number.isInteger(offset)) opt.pluralOffset = offset;
  if (options.type === 'ordinal') opt.type = 'ordinal';

  return new MessageMF1Number(locales, num, {
    options: opt,
    source: arg?.source
  });
}
Object.freeze(number);

function time(locales: string[], options: RuntimeOptions, arg?: MessageValue) {
  let time: Date | MessageDateTime;
  if (!arg) time = new Date(NaN); // Invalid Date
  else if (arg instanceof MessageDateTime) time = arg;
  else if (typeof arg.value === 'number') time = new Date(arg.value);
  else time = new Date(String(arg.value));
  const size = getParam(options) as DateTimeSize;
  const opt: Intl.DateTimeFormatOptions = {
    localeMatcher: options.localeMatcher,
    second: size === 'short' ? undefined : 'numeric',
    minute: 'numeric',
    hour: 'numeric',
    timeZoneName: size === 'full' || size === 'long' ? 'short' : undefined
  };
  return new MessageDateTime(locales, time, { options: opt });
}
Object.freeze(time);

/**
 * Build a {@link messageformat#MessageFormat} runtime to use with ICU MessageFormat 1 messages.
 *
 * The structure of this runtime and the options available for its formatters
 * follow the MF1 specifications, rather than being based on the MF2 default runtime.
 *
 * @beta
 */
export const getMF1Runtime = () => ({ date, duration, number, time });
