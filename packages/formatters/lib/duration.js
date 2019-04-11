/**
 * Represent a duration in seconds as a string
 *
 * Input should be a finite number; output will include one or two `:`
 * separators, and match the pattern `hhhh:mm:ss`, possibly with a leading `-`
 * for negative values and a trailing `.sss` part for non-integer input
 *
 * @memberof Formatters
 * @param {number|string} value - A finite number, or its string representation
 *
 * @example
 * var mf = new MessageFormat();
 *
 * mf.compile('It has been {D, duration}')({ D: 123 })
 * // 'It has been 2:03'
 *
 * mf.compile('Countdown: {D, duration}')({ D: -151200.42 })
 * // 'Countdown: -42:00:00.420'
 */
function duration(value) {
  if (!isFinite(value)) return String(value);
  var sign = '';
  if (value < 0) {
    sign = '-';
    value = Math.abs(value);
  } else {
    value = Number(value);
  }
  var sec = value % 60;
  var parts = [Math.round(sec) === sec ? sec : sec.toFixed(3)];
  if (value < 60) {
    parts.unshift(0); // at least one : is required
  } else {
    value = Math.round((value - parts[0]) / 60);
    parts.unshift(value % 60); // minutes
    if (value >= 60) {
      value = Math.round((value - parts[0]) / 60);
      parts.unshift(value); // hours
    }
  }
  var first = parts.shift();
  return (
    sign +
    first +
    ':' +
    parts
      .map(function(n) {
        return n < 10 ? '0' + String(n) : String(n);
      })
      .join(':')
  );
}

module.exports = function() {
  return duration;
};
