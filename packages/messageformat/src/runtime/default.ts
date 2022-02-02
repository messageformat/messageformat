import { MessageDateTime, MessageNumber, MessageValue } from '../message-value';
import type { RuntimeFunction, RuntimeOptions } from './index';

export const datetime: RuntimeFunction<MessageDateTime> = {
  call: function datetime(
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
    return new MessageDateTime(locales, date, { options });
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

export const number: RuntimeFunction<MessageNumber> = {
  call: function number(
    locales: string[],
    options: RuntimeOptions | undefined,
    arg: MessageValue
  ) {
    const num = arg instanceof MessageNumber ? arg : Number(arg.getValue());
    return new MessageNumber(locales, num, { options });
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
    unitDisplay: 'string',

    // Intl.PluralRules
    type: ['cardinal', 'ordinal']
  }
};

export const runtime = {
  datetime,
  number
};
