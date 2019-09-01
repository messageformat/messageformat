/** Represent a number as an integer, percent or currency value
 *
 *  Available in MessageFormat strings as `{VAR, number, integer|percent|currency}`.
 *  Internally, calls Intl.NumberFormat with appropriate parameters. `currency` will
 *  default to USD; to change, set `MessageFormat#currency` to the appropriate
 *  three-letter currency code, or use the `currency:EUR` form of the argument.
 *
 * @memberof Formatters
 * @param {number} value - The value to operate on
 * @param {string} type - One of `'integer'`, `'percent'` , `'currency'`, or `/currency:[A-Z]{3}/`
 *
 * @example
 * var mf = new MessageFormat('en', { currency: 'EUR'});
 *
 * mf.compile('{N} is almost {N, number, integer}')({ N: 3.14 })
 * // '3.14 is almost 3'
 *
 * mf.compile('{P, number, percent} complete')({ P: 0.99 })
 * // '99% complete'
 *
 * mf.compile('The total is {V, number, currency}.')({ V: 5.5 })
 * // 'The total is €5.50.'
 *
 * mf.compile('The total is {V, number, currency:GBP}.')({ V: 5.5 })
 * // 'The total is £5.50.'
 */

export function numberFmt(value, lc, arg, defaultCurrency) {
  var a = (arg && arg.split(':')) || [];
  var opt = {
    integer: { maximumFractionDigits: 0 },
    percent: { style: 'percent' },
    currency: {
      style: 'currency',
      currency: (a[1] && a[1].trim()) || defaultCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  };
  return new Intl.NumberFormat(lc, opt[a[0]] || {}).format(value);
}

export function numberCurrency(value, lc, arg) {
  return new Intl.NumberFormat(lc, {
    style: 'currency',
    currency: arg,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function numberInteger(value, lc) {
  return new Intl.NumberFormat(lc, { maximumFractionDigits: 0 }).format(value);
}

export function numberPercent(value, lc) {
  return new Intl.NumberFormat(lc, { style: 'percent' }).format(value);
}
