import {
  extendLocaleContext,
  MessageDateTime,
  MessageNumber,
  MessageValue
} from '../message-value';
import type { RuntimeFunction, RuntimeOptions } from './index';

const getParam = (options: RuntimeOptions | undefined) =>
  (options && String(options.param).trim()) || undefined;

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

export const date: RuntimeFunction<MessageDateTime> = {
  call: function date(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: MessageValue
  ) {
    let date: Date | MessageDateTime;
    if (arg instanceof MessageDateTime) date = arg;
    else {
      const value = arg.getValue();
      date = new Date(typeof value === 'number' ? value : String(value));
    }
    const size = getParam(options) as DateTimeSize;
    const opt: Intl.DateTimeFormatOptions = {
      localeMatcher: options?.localeMatcher,
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
  },

  options: { param: 'string' }
};

/**
 * Represent a duration in seconds as a string
 *
 * @return Includes one or two `:` separators, and matches the pattern
 *   `hhhh:mm:ss`, possibly with a leading `-` for negative values and a
 *   trailing `.sss` part for non-integer input
 */
export const duration: RuntimeFunction<string> = {
  call: function duration(
    _locales: string[],
    _options: unknown,
    arg: MessageValue
  ) {
    let value = Number(arg.getValue());
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
  },
  options: 'never'
};

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
        number = number.getValue();
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

export const number: RuntimeFunction<MessageNumber> = {
  call: function number(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: MessageValue
  ) {
    const num = arg instanceof MessageNumber ? arg : Number(arg.getValue());
    const opt: Intl.NumberFormatOptions &
      Intl.PluralRulesOptions & { pluralOffset?: number } = {};
    if (options) {
      switch (String(options.param).trim()) {
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
      if (Number.isFinite(offset)) opt.pluralOffset = offset;
      if (options.type === 'ordinal') opt.type = 'ordinal';
    }

    return new MessageMF1Number(locales, num, {
      options: opt,
      source: arg.source
    });
  },

  options: {
    param: 'string',
    pluralOffset: 'number',
    type: ['cardinal', 'ordinal']
  }
};

export const time: RuntimeFunction<MessageDateTime> = {
  call: function time(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: MessageValue
  ) {
    let time: Date | MessageDateTime;
    if (arg instanceof MessageDateTime) time = arg;
    else {
      const value = arg.getValue();
      time = new Date(typeof value === 'number' ? value : String(value));
    }
    const size = getParam(options) as DateTimeSize;
    const opt: Intl.DateTimeFormatOptions = {
      localeMatcher: options?.localeMatcher,
      second: size === 'short' ? undefined : 'numeric',
      minute: 'numeric',
      hour: 'numeric',
      timeZoneName: size === 'full' || size === 'long' ? 'short' : undefined
    };
    return new MessageDateTime(locales, time, { options: opt });
  },

  options: { param: ['short', 'default', 'long', 'full'] }
};

export const runtime = {
  date,
  duration,
  number,
  time
};
