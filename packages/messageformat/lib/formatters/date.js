/* eslint-disable no-fallthrough */

/** Represent a date as a short/default/long/full string
 *
 * The input value needs to be in a form that the
 * {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date Date object}
 * can process using its single-argument form, `new Date(value)`.
 *
 * @memberof Formatters
 * @param {number|string} value - Either a Unix epoch time in milliseconds, or a string value representing a date
 * @param {string} [type='default'] - One of `'short'`, `'default'`, `'long'` , or `full`
 *
 * @example
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
 */
function date(v, lc, p) {
  var o = { day: 'numeric', month: 'short', year: 'numeric' };
  switch (p) {
    case 'full':
      o.weekday = 'long';
    case 'long':
      o.month = 'long';
      break;
    case 'short':
      o.month = 'numeric';
  }
  return new Date(v).toLocaleDateString(lc, o);
}

module.exports = function() {
  return date;
};
