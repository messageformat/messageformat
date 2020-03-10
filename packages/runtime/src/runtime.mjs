/** A set of utility functions that are called by the compiled Javascript
 *  functions, these are included locally in the output of {@link
 *  MessageFormat#compile compile()}.
 *
 * @module messageformat-runtime
 */

/** @private */
export function _nf(lc) {
  return _nf[lc] || (_nf[lc] = new Intl.NumberFormat(lc));
}

/**
 * Utility function for `#` in plural rules
 *
 * @param {string} lc - The current locale
 * @param {number} value - The value to operate on
 * @param {number} offset - An offset, set by the surrounding context
 * @returns {string} The result of applying the offset to the input value
 */
export function number(lc, value, offset) {
  return _nf(lc).format(value - offset);
}

/**
 * Strict utility function for `#` in plural rules
 *
 * Will throw an Error if `value` or `offset` are non-numeric.
 *
 * @param {string} lc - The current locale
 * @param {number} value - The value to operate on
 * @param {number} offset - An offset, set by the surrounding context
 * @param {string} name - The name of the argument, used for error reporting
 * @returns {string} The result of applying the offset to the input value
 */
export function strictNumber(lc, value, offset, name) {
  var n = value - offset;
  if (isNaN(n)) throw new Error('`' + name + '` or its offset is not a number');
  return _nf(lc).format(n);
}

/** Utility function for `{N, plural|selectordinal, ...}`
 *
 * @param {number} value - The key to use to find a pluralization rule
 * @param {number} offset - An offset to apply to `value`
 * @param {function} lcfunc - A locale function from `pluralFuncs`
 * @param {Object.<string,string>} data - The object from which results are looked up
 * @param {?boolean} isOrdinal - If true, use ordinal rather than cardinal rules
 * @returns {string} The result of the pluralization
 */
export function plural(value, offset, lcfunc, data, isOrdinal) {
  if ({}.hasOwnProperty.call(data, value)) return data[value];
  if (offset) value -= offset;
  var key = lcfunc(value, isOrdinal);
  return key in data ? data[key] : data.other;
}

/** Utility function for `{N, select, ...}`
 *
 * @param {number} value - The key to use to find a selection
 * @param {Object.<string,string>} data - The object from which results are looked up
 * @returns {string} The result of the select statement
 */
export function select(value, data) {
  return {}.hasOwnProperty.call(data, value) ? data[value] : data.other;
}

/**
 * Checks that all required arguments are set to defined values
 *
 * Throws on failure; otherwise returns undefined
 *
 * @param {string[]} keys - The required keys
 * @param {Object.<string,string>} data - The data object being checked
 */
export function reqArgs(keys, data) {
  for (var i = 0; i < keys.length; ++i)
    if (!data || data[keys[i]] === undefined)
      throw new Error(`Message requires argument '${keys[i]}'`);
}
