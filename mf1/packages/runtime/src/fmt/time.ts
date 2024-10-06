/**
 * Represent a time as a short/default/long string
 *
 * @param value Either a Unix epoch time in milliseconds, or a string value
 *   representing a date. Parsed with `new Date(value)`
 *
 * @example
 * ```js
 * var mf = new MessageFormat(['en', 'fi']);
 *
 * mf.compile('The time is now {T, time}')({ T: Date.now() })
 * // 'The time is now 11:26:35 PM'
 *
 * mf.compile('Kello on nyt {T, time}', 'fi')({ T: Date.now() })
 * // 'Kello on nyt 23.26.35'
 *
 * var cf = mf.compile('The Eagle landed at {T, time, full} on {T, date, full}');
 * cf({ T: '1969-07-20 20:17:40 UTC' })
 * // 'The Eagle landed at 10:17:40 PM GMT+2 on Sunday, July 20, 1969'
 * ```
 */
export function time(
  value: number | string,
  lc: string | string[],
  size?: 'short' | 'default' | 'long' | 'full'
) {
  const o: Intl.DateTimeFormatOptions = {
    second: 'numeric',
    minute: 'numeric',
    hour: 'numeric'
  };
  switch (size) {
    case 'full':
    case 'long':
      o.timeZoneName = 'short';
      break;
    case 'short':
      delete o.second;
  }
  return new Date(value).toLocaleTimeString(lc, o);
}
