/**
 * A set of utility functions that are called by the compiled Javascript
 * functions, these are included locally in the output of {@link MessageFormat.compile compile()}.
 */

/** @private */
export function _nf(lc: string): Intl.NumberFormat {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return _nf[lc] || (_nf[lc] = new Intl.NumberFormat(lc));
}

/**
 * Utility function for `#` in plural rules
 *
 * @param lc The current locale
 * @param value The value to operate on
 * @param offset An offset, set by the surrounding context
 * @returns The result of applying the offset to the input value
 */
export function number(lc: string, value: number, offset: number) {
  return _nf(lc).format(value - offset);
}

/**
 * Strict utility function for `#` in plural rules
 *
 * Will throw an Error if `value` or `offset` are non-numeric.
 *
 * @param lc The current locale
 * @param value The value to operate on
 * @param offset An offset, set by the surrounding context
 * @param name The name of the argument, used for error reporting
 * @returns The result of applying the offset to the input value
 */
export function strictNumber(
  lc: string,
  value: number,
  offset: number,
  name: string
) {
  const n = value - offset;
  if (isNaN(n)) throw new Error('`' + name + '` or its offset is not a number');
  return _nf(lc).format(n);
}

/**
 * Utility function for `{N, plural|selectordinal, ...}`
 *
 * @param value The key to use to find a pluralization rule
 * @param offset An offset to apply to `value`
 * @param lcfunc A locale function from `pluralFuncs`
 * @param data The object from which results are looked up
 * @param isOrdinal If true, use ordinal rather than cardinal rules
 * @returns The result of the pluralization
 */
export function plural(
  value: number,
  offset: number,
  lcfunc: (value: number, isOrdinal?: boolean) => string,
  data: { [key: string]: unknown },
  isOrdinal?: boolean
) {
  if ({}.hasOwnProperty.call(data, value)) return data[value];
  if (offset) value -= offset;
  const key = lcfunc(value, isOrdinal);
  return key in data ? data[key] : data.other;
}

/**
 * Utility function for `{N, select, ...}`
 *
 * @param value The key to use to find a selection
 * @param data The object from which results are looked up
 * @returns The result of the select statement
 */
export function select(value: string, data: { [key: string]: unknown }) {
  return {}.hasOwnProperty.call(data, value) ? data[value] : data.other;
}

/**
 * Checks that all required arguments are set to defined values
 *
 * Throws on failure; otherwise returns undefined
 *
 * @param keys The required keys
 * @param data The data object being checked
 */
export function reqArgs(keys: string[], data: { [key: string]: unknown }) {
  for (let i = 0; i < keys.length; ++i)
    if (!data || data[keys[i]] === undefined)
      throw new Error(`Message requires argument '${keys[i]}'`);
}
