export { getLocaleDir } from '../dir-utils.js';

/**
 * Utility function for custom functions.
 * Cast a value as a Boolean,
 * unwrapping objects using their `valueOf()` methods.
 * Also accepts `'true'` and `'false'`.
 * Throws a `RangeError` for invalid inputs.
 *
 * @beta
 */
export function asBoolean(value: unknown): boolean {
  if (value && typeof value === 'object') value = value.valueOf();
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object') value = String(value);
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new RangeError('Not a boolean');
}

/**
 * Utility function for custom functions.
 * Cast a value as a non-negative integer,
 * unwrapping objects using their `valueOf()` methods.
 * Also accepts JSON string reprentations of integers.
 * Throws a `RangeError` for invalid inputs.
 *
 * @beta
 */
export function asPositiveInteger(value: unknown): number {
  if (value && typeof value === 'object') value = value.valueOf();
  if (value && typeof value === 'object') value = String(value);
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) {
    value = Number(value);
  }
  if (typeof value === 'number' && value >= 0 && Number.isInteger(value)) {
    return value;
  }
  throw new RangeError('Not a positive integer');
}

/**
 * Utility function for custom functions.
 * Cast a value as a string,
 * unwrapping objects using their `valueOf()` methods.
 * Throws a `RangeError` for invalid inputs.
 *
 * @beta
 */
export function asString(value: unknown): string {
  if (value && typeof value === 'object') value = value.valueOf();
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return String(value);
  throw new RangeError('Not a string');
}
