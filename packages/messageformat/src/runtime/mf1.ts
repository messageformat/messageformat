import {
  Formattable,
  FormattableDateTime,
  FormattableNumber
} from '../formattable';
import type { RuntimeFunction, RuntimeOptions } from './index';

const getParam = (options: RuntimeOptions | undefined) =>
  (options && String(options.param).trim()) || undefined;

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

export const date: RuntimeFunction<FormattableDateTime> = {
  call: function date(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: Formattable
  ) {
    let date: Date | FormattableDateTime;
    if (arg instanceof FormattableDateTime) date = arg;
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
    return new FormattableDateTime(date, locales, opt);
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
    arg: Formattable
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

export const number: RuntimeFunction<FormattableNumber> = {
  call: function number(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: Formattable
  ) {
    const num = arg instanceof FormattableNumber ? arg : Number(arg.getValue());
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

    const fmt = new FormattableNumber(
      num,
      locales,
      Object.keys(opt).length > 0 ? opt : undefined
    );
    fmt.getValue = () => {
      const num = fmt.value;
      const opt = (fmt.options || {}) as { pluralOffset?: number };
      const offset = Number(opt.pluralOffset || 0);
      return typeof num === 'bigint' ? num - BigInt(offset) : num - offset;
    };
    return fmt;
  },

  options: {
    param: 'string',
    pluralOffset: 'number',
    type: ['cardinal', 'ordinal']
  }
};

export const time: RuntimeFunction<FormattableDateTime> = {
  call: function time(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: Formattable
  ) {
    let time: Date | FormattableDateTime;
    if (arg instanceof FormattableDateTime) time = arg;
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
    return new FormattableDateTime(time, locales, opt);
  },

  options: { param: ['short', 'default', 'long', 'full'] }
};

export const runtime = {
  date,
  duration,
  number,
  time
};
