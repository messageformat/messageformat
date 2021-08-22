import { FormattableDateTime, FormattableNumber } from '../formattable';
import type { RuntimeFunction, RuntimeOptions } from './index';

export const datetime: RuntimeFunction<FormattableDateTime> = {
  call: function datetime(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    const date =
      arg instanceof Date || arg instanceof FormattableDateTime
        ? arg
        : new Date(typeof arg === 'number' ? arg : String(arg));
    return new FormattableDateTime(date, locales, options);
  },

  formattable: FormattableDateTime,

  options: {
    localeMatcher: ['best fit', 'lookup'],
    weekday: ['long', 'short', 'narrow'],
    era: ['long', 'short', 'narrow'],
    year: ['numeric', '2-digit'],
    month: ['numeric', '2-digit', 'long', 'short', 'narrow'],
    day: ['numeric', '2-digit'],
    hour: ['numeric', '2-digit'],
    minute: ['numeric', '2-digit'],
    second: ['numeric', '2-digit'],
    timeZoneName: ['long', 'short'],
    formatMatcher: ['best fit', 'basic'],
    hour12: 'boolean',
    timeZone: 'string',

    // ES 2020
    dateStyle: ['full', 'long', 'medium', 'short'],
    timeStyle: ['full', 'long', 'medium', 'short'],
    calendar: 'string',
    dayPeriod: ['narrow', 'short', 'long'],
    numberingSystem: 'string',
    hourCycle: ['h11', 'h12', 'h23', 'h24'],
    fractionalSecondDigits: 'number' // 0 | 1 | 2 | 3
  }
};

export const number: RuntimeFunction<FormattableNumber> = {
  call: function number(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    const num =
      typeof arg === 'number' ||
      arg instanceof BigInt ||
      arg instanceof FormattableNumber
        ? arg
        : Number(arg);
    return new FormattableNumber(num, locales, options);
  },

  formattable: FormattableNumber,

  options: {
    localeMatcher: ['best fit', 'lookup'],
    style: 'string',
    currency: 'string',
    currencyDisplay: 'string',
    currencySign: 'string',
    useGrouping: 'boolean',
    minimumIntegerDigits: 'number',
    minimumFractionDigits: 'number',
    maximumFractionDigits: 'number',
    minimumSignificantDigits: 'number',
    maximumSignificantDigits: 'number',

    // ES 2020
    compactDisplay: 'string',
    notation: 'string',
    signDisplay: 'string',
    unit: 'string',
    unitDisplay: 'string'
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
    const pr = new Intl.PluralRules(locales, options);
    const cat = pr.select(n);
    return Number.isInteger(n) ? [String(n), cat] : [cat];
  },

  options: {
    localeMatcher: ['lookup', 'best fit'],
    type: ['cardinal', 'ordinal'],
    minimumIntegerDigits: 'number',
    minimumFractionDigits: 'number',
    maximumFractionDigits: 'number',
    minimumSignificantDigits: 'number',
    maximumSignificantDigits: 'number'
  }
};

export const runtime = {
  datetime,
  number,
  plural
};
