/**
 * Tools for working with
 * {@link https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html | ICU NumberFormat skeletons}
 * and {@link http://unicode.org/reports/tr35/tr35-numbers.html#Number_Format_Patterns | patterns}.
 *
 * @remarks
 * ```js
 * import {
 *  getNumberFormatOptions,
 *  getNumberFormatter,
 *  getNumberFormatterSource,
 *  NumberFormatError,
 *  parseNumberPattern,
 *  parseNumberSkeleton,
 *  type Skeleton
 * } from '@messageformat/number-skeleton'
 * ```
 *
 * The package is released as an ES module only. If using from a CommonJS
 * context, you may need to `import()` it, or use a module loader like
 * {@link https://www.npmjs.com/package/esm | esm}.
 *
 * Uses {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat | Intl.NumberFormat}
 * internally (ES2020).
 *
 * @packageDocumentation
 */

export {
  BadOptionError,
  BadStemError,
  MaskedValueError,
  MissingOptionError,
  NumberFormatError,
  TooManyOptionsError,
  UnsupportedError
} from './errors.js';
export {
  getNumberFormatter,
  getNumberFormatterSource
} from './get-formatter.js';
export { getNumberFormatOptions } from './numberformat/options.js';
export { parseNumberPattern } from './parse-pattern.js';
export { parseNumberSkeleton } from './parse-skeleton.js';
export type { Skeleton } from './types/skeleton.js';
