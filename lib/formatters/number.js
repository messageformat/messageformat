/** Represent a number as an integer, percent or currency value
 *
 *  Available in MessageFormat strings as `{VAR, number, integer|percent|currency}`.
 *  Internally, calls Intl.NumberFormat with appropriate parameters. `currency` will
 *  default to USD; to change, set `MessageFormat#currency` to the appropriate
 *  three-letter currency code.
 *
 * @memberof Formatters
 * @param {number} value - The value to operate on
 * @param {string} type - One of `'integer'`, `'percent'` , or `currency`
 *
 * @example
 * var mf = new MessageFormat('en');
 * mf.currency = 'EUR';  // needs to be set before first compile() call
 *
 * mf.compile('{N} is almost {N, number, integer}')({ N: 3.14 })
 * // '3.14 is almost 3'
 *
 * mf.compile('{P, number, percent} complete')({ P: 0.99 })
 * // '99% complete'
 *
 * mf.compile('The total is {V, number, currency}.')({ V: 5.5 })
 * // 'The total is €5.50.'
 */
function number(mf) {
  return new Function("v,lc,p",
    "return new Intl.NumberFormat(lc,\n" +
    "    p=='integer' ? {maximumFractionDigits:0}\n" +
    "  : p=='percent' ? {style:'percent'}\n" +
    "  : p=='currency' ? {style:'currency', currency:'" + (mf.currency || 'USD') + "', minimumFractionDigits:2, maximumFractionDigits:2}\n" +
    "  : {}).format(v)"
  );
}

module.exports = number;
