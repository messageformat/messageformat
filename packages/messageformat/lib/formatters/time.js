/** Represent a time as a short/default/long string
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
 * mf.compile('The time is now {T, time}')({ T: Date.now() })
 * // 'The time is now 11:26:35 PM'
 *
 * mf.compile('Kello on nyt {T, time}', 'fi')({ T: Date.now() })
 * // 'Kello on nyt 23.26.35'
 *
 * var cf = mf.compile('The Eagle landed at {T, time, full} on {T, date, full}');
 * cf({ T: '1969-07-20 20:17:40 UTC' })
 * // 'The Eagle landed at 10:17:40 PM GMT+2 on Sunday, July 20, 1969'
 */
function time(v, lc, p) {
  var o = { second: 'numeric', minute: 'numeric', hour: 'numeric' };
  switch (p) {
    case 'full':
    case 'long':
      o.timeZoneName = 'short';
      break;
    case 'short':
      delete o.second;
  }
  return new Date(v).toLocaleTimeString(lc, o);
}

module.exports = function() {
  return time;
};
