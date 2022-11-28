import { MessageDateTime, MessageNumber, MessageValue } from '../message-value';
import { castAsBoolean, castAsInteger } from './cast';
import type { RuntimeOptions } from './index';

export function datetime(
  locales: string[],
  options: RuntimeOptions,
  arg?: MessageValue
): MessageDateTime {
  let date: Date | MessageDateTime;
  if (!arg) date = new Date();
  else if (arg instanceof MessageDateTime) date = arg;
  else if (typeof arg.value === 'number') date = new Date(arg.value);
  else date = new Date(String(arg.value));
  castAsBoolean(options, 'hour12');
  castAsInteger(options, 'fractionalSecondDigits');
  return new MessageDateTime(locales, date, { options });
}
Object.freeze(datetime);

export function number(
  locales: string[],
  options: RuntimeOptions,
  arg?: MessageValue
): MessageNumber {
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
Object.freeze(number);
