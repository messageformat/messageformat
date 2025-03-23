/**
 * Tools for working with
 * {@link https://unicode-org.github.io/icu/userguide/format_parse/datetime/ | ICU DateFormat skeletons}.
 *
 * @remarks
 * ```js
 * import {
 *   DateFormatError,
 *   DateToken, // TS only
 *   getDateFormatter,
 *   getDateFormatterSource,
 *   parseDateTokens
 * } from '@messageformat/date-skeleton'
 * ```
 *
 * The package is released as an ES module only. If using from a CommonJS
 * context, you may need to `import()` it, or use a module loader like
 * {@link https://www.npmjs.com/package/esm | esm}.
 *
 * Uses
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat | Intl.DateTimeFormat}
 * internally. Position-dependent ICU DateFormat
 * {@link https://unicode.org/reports/tr35/tr35-dates.html#Date_Format_Patterns | patterns}
 * are not supported, as they cannot be represented with Intl.DateTimeFormat options.
 *
 * @packageDocumentation
 */

export {
  DateFormatError,
  getDateFormatter,
  getDateFormatterSource
} from './get-date-formatter.js';
export { getDateTimeFormatOptions } from './options.js';
export { type DateToken, parseDateTokens } from './tokens.js';
