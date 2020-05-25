/**
 * Represent a date as a short/default/long/full string
 *
 * @param value Either a Unix epoch time in milliseconds, or a string value
 *   representing a date. Parsed with `new Date(value)`
 *
 * @example
 * ```js
 * var mf = new MessageFormat(['en', 'fi']);
 *
 * mf.compile('Today is {T, date}')({ T: Date.now() })
 * // 'Today is Feb 21, 2016'
 *
 * mf.compile('Tänään on {T, date}', 'fi')({ T: Date.now() })
 * // 'Tänään on 21. helmikuuta 2016'
 *
 * mf.compile('Unix time started on {T, date, full}')({ T: 0 })
 * // 'Unix time started on Thursday, January 1, 1970'
 *
 * var cf = mf.compile('{sys} became operational on {d0, date, short}');
 * cf({ sys: 'HAL 9000', d0: '12 January 1999' })
 * // 'HAL 9000 became operational on 1/12/1999'
 * ```
 */
export function date(
  value: number | string,
  lc: string | string[],
  size?: 'short' | 'default' | 'long' | 'full'
) {
  const o: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  /* eslint-disable no-fallthrough */
  switch (size) {
    case 'full':
      o.weekday = 'long';
    case 'long':
      o.month = 'long';
      break;
    case 'short':
      o.month = 'numeric';
  }
  return new Date(value).toLocaleDateString(lc, o);
}
