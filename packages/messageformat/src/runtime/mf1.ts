import { FormattableDateTime, FormattableNumber } from '../formattable';
import { runtime as MF2 } from './default';
import type { RuntimeFunction, RuntimeOptions } from './index';

const getParam = (options: RuntimeOptions | undefined) =>
  (options && String(options.param).trim()) || undefined;

type DateTimeSize = 'short' | 'default' | 'long' | 'full';

export const date: RuntimeFunction<FormattableDateTime> = {
  call: function date(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    const date =
      arg instanceof Date || arg instanceof FormattableDateTime
        ? arg
        : new Date(typeof arg === 'number' ? arg : String(arg));
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

  formattable: FormattableDateTime,
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
  call: function duration(_locales: string[], _options: unknown, arg: unknown) {
    let value = typeof arg === 'number' ? arg : Number(arg);
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
    arg: unknown
  ) {
    let num =
      typeof arg === 'number' ||
      typeof arg === 'bigint' ||
      arg instanceof FormattableNumber
        ? arg
        : Number(arg);
    const offset = Number(options?.pluralOffset);
    if (Number.isFinite(offset)) {
      if (num instanceof FormattableNumber) num = num.value; // FIXME
      if (typeof num === 'bigint') num -= BigInt(offset);
      else num -= offset;
    }
    const param = getParam(options);
    let opt: Intl.NumberFormatOptions | undefined = undefined;
    switch (param) {
      case 'integer':
        opt = { maximumFractionDigits: 0 };
        break;
      case 'percent':
        opt = { style: 'percent' };
        break;
      case 'currency': {
        opt = { style: 'currency', currency: 'USD' };
        break;
      }
    }
    return new FormattableNumber(num, locales, opt);
  },

  formattable: FormattableNumber,
  options: {
    param: 'string',
    pluralOffset: 'number'
  }
};

export const plural: RuntimeFunction<string[]> = {
  call: function plural(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    const n = Number(arg);
    if (!Number.isFinite(n)) return ['other'];
    const offset = Number(options && options.pluralOffset);
    const pr = new Intl.PluralRules(locales, options);
    const cat = pr.select(Number.isFinite(offset) ? n - offset : n);
    return Number.isInteger(n) ? [String(n), cat] : [cat];
  },

  options: Object.assign({ pluralOffset: 'number' }, MF2.plural.options)
};

export const time: RuntimeFunction<FormattableDateTime> = {
  call: function time(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    const time =
      arg instanceof Date || arg instanceof FormattableDateTime
        ? arg
        : new Date(typeof arg === 'number' ? arg : String(arg));
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

  formattable: FormattableDateTime,
  options: { param: ['short', 'default', 'long', 'full'] }
};

export const runtime = {
  date,
  duration,
  number,
  plural,
  time
};
