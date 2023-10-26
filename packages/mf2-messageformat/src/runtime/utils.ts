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
  if (value instanceof Boolean) value = value.valueOf();
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object') value = String(value);
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new RangeError('Not a boolean');
}

/**
 * Utility function for custom functions.
 * Cast a value as a positive integer,
 * unwrapping objects using their `valueOf()` methods.
 * Also accepts JSON string reprentations of integers.
 * Throws a `RangeError` for invalid inputs.
 *
 * @beta
 */
export function asPositiveInteger(value: unknown): number {
  if (value instanceof Number) value = Number(value);
  if (typeof value === 'object' && value) value = String(value);
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
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return String(value);
  throw new RangeError('Not a string');
}

/**
 * Utility function for custom functions.
 * Merge the locales set for the message,
 * an `options` property on the input,
 * and the `locale` option of the expression.
 *
 * @beta
 */
export function mergeLocales(
  locales: string[],
  input: unknown,
  options: Record<string, unknown> | null
): string[] {
  // Message locales are always included, but have the lowest precedence
  let lc = locales;

  // Next, use options from input object
  if (input && typeof input === 'object' && 'locale' in input) {
    if (typeof input.locale === 'string') {
      lc = [input.locale, ...lc];
    } else if (
      Array.isArray(input.locale) &&
      input.locale.every(lc => typeof lc === 'string')
    ) {
      lc = [...input.locale, ...lc];
    }
  }

  // Explicit locale in expression options is preferred over all others
  if (options?.locale) {
    lc = [...asString(options.locale).split(','), ...lc];
  }

  return lc;
}
