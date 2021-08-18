import { Runtime, RuntimeFunction, RuntimeOptions } from './index';

export const datetime: RuntimeFunction<string> = {
  call: function datetime(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    const d =
      typeof arg === 'number' || arg instanceof Date
        ? arg
        : new Date(String(arg));
    const dtf = new Intl.DateTimeFormat(locales, options);
    return dtf.format(d);
  },

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

export const number: RuntimeFunction<string> = {
  call: function number(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    const nf = new Intl.NumberFormat(locales, options);
    return nf.format(Number(arg));
  },

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

export const plural: RuntimeFunction<[number, Intl.LDMLPluralRule]> = {
  call: function plural(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: unknown
  ) {
    const n = Number(arg);
    const pr = new Intl.PluralRules(locales, options);
    return [n, pr.select(n)];
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

export const runtime: Runtime<string> = {
  select: { plural },
  format: { datetime, number }
};
