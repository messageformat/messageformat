import { RuntimeOptions } from './index';

/**
 * Utility function for custom functions.
 * Cast resolved option values `'true'` and `'false'` to their Boolean equivalents.
 * Any other values are untouched.
 *
 * @beta
 * @param options Options object, which may be modified.
 * @param names Names of options that should have boolean values.
 */
export function castAsBoolean(options: RuntimeOptions, ...names: string[]) {
  for (const name of names) {
    const value = options[name];
    if (typeof value === 'string') {
      if (value === 'true') options[name] = true;
      else if (value === 'false') options[name] = false;
    }
  }
}

/**
 * Utility function for custom functions.
 * Cast resolved option values with numerical string representations of integers
 * to their Number equivalents. Any other values are untouched.
 *
 * @beta
 * @param options Options object, which may be modified.
 * @param names Names of options that should have integer values.
 */
export function castAsInteger(options: RuntimeOptions, ...names: string[]) {
  for (const name of names) {
    const value = options[name];
    if (typeof value === 'string') {
      const num = Number(value);
      if (Number.isInteger(num)) options[name] = num;
    }
  }
}
