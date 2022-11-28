import { MessageDateTime, MessageNumber, MessageValue } from '../message-value';
import { castAsBoolean, castAsInteger } from './cast';
import type { RuntimeFunction, RuntimeOptions } from './index';

export const datetime: RuntimeFunction<MessageDateTime> = {
  call: function datetime(
    locales: string[],
    options: RuntimeOptions,
    arg?: MessageValue
  ) {
    let date: Date | MessageDateTime;
    if (!arg) date = new Date();
    else if (arg instanceof MessageDateTime) date = arg;
    else if (typeof arg.value === 'number') date = new Date(arg.value);
    else date = new Date(String(arg.value));
    castAsBoolean(options, 'hour12');
    castAsInteger(options, 'fractionalSecondDigits');
    return new MessageDateTime(locales, date, { options });
  }
};

export const number: RuntimeFunction<MessageNumber> = {
  call: function number(
    locales: string[],
    options: RuntimeOptions,
    arg?: MessageValue
  ) {
    const num = arg instanceof MessageNumber ? arg : Number(arg?.value);
    castAsBoolean(options, 'useGrouping');
    castAsInteger(
      options,
      'minimumIntegerDigits',
      'minimumFractionDigits',
      'maximumFractionDigits',
      'minimumSignificantDigits',
      'maximumSignificantDigits'
    );
    return new MessageNumber(locales, num, { options });
  }
};
