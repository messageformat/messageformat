import { NumberFormatError } from './errors.js';
import { getNumberFormatLocales } from './numberformat/locales.js';
import {
  getNumberFormatModifier,
  getNumberFormatModifierSource
} from './numberformat/modifier.js';
import { getNumberFormatOptions } from './numberformat/options.js';
import { parseNumberPattern } from './parse-pattern.js';
import { parseNumberSkeleton } from './parse-skeleton.js';
import { Skeleton } from './types/skeleton.js';

/**
 * Returns a number formatter function for the given locales and number skeleton
 *
 * @remarks
 * Uses `Intl.NumberFormat` internally, including features provided by the
 * {@link https://github.com/tc39/proposal-unified-intl-numberformat | Unified
 * API Proposal}.
 *
 * @public
 * @param locales - One or more valid BCP 47 language tags, e.g. `fr` or `en-CA`
 * @param skeleton - An ICU NumberFormatter pattern or `::`-prefixed skeleton
 *   string, or a parsed `Skeleton` structure
 * @param currency - If `skeleton` is a pattern string that includes ¤ tokens,
 *   their skeleton representation requires a three-letter currency code.
 * @param onError - If defined, will be called separately for each encountered
 *   parsing error and unsupported feature.
 * @example
 * ```js
 * import { getNumberFormatter } from '@messageformat/number-skeleton'
 *
 * let src = ':: currency/CAD unit-width-narrow'
 * let fmt = getNumberFormatter('en-CA', src, console.error)
 * fmt(42) // '$42.00'
 *
 * src = '::percent scale/100'
 * fmt = getNumberFormatter('en', src, console.error)
 * fmt(0.3) // '30%'
 * ```
 */
export function getNumberFormatter(
  locales: string | string[],
  skeleton: string | Skeleton,
  currency?: string | null,
  onError?: (err: NumberFormatError) => void
) {
  if (typeof skeleton === 'string') {
    skeleton =
      skeleton.indexOf('::') === 0
        ? parseNumberSkeleton(skeleton.slice(2), onError)
        : parseNumberPattern(skeleton, currency, onError);
  }
  const lc = getNumberFormatLocales(locales, skeleton);
  const opt = getNumberFormatOptions(skeleton, onError);
  const mod = getNumberFormatModifier(skeleton);
  const nf = new Intl.NumberFormat(lc, opt);
  if (skeleton.affix) {
    const [p0, p1] = skeleton.affix.pos;
    const [n0, n1] = skeleton.affix.neg || ['', ''];
    return (value: number) => {
      const n = nf.format(mod(value));
      return value < 0 ? `${n0}${n}${n1}` : `${p0}${n}${p1}`;
    };
  }
  return (value: number) => nf.format(mod(value));
}

/**
 * Returns a string of JavaScript source that evaluates to a number formatter
 * function with the same `(value: number) => string` signature as the function
 * returned by {@link getNumberFormatter}.
 *
 * @remarks
 * The returned function will memoize an `Intl.NumberFormat` instance that makes
 * use of features provided by the {@link
 * https://github.com/tc39/proposal-unified-intl-numberformat | Unified API
 * Proposal}.
 *
 * @public
 * @param locales - One or more valid BCP 47 language tags, e.g. `fr` or `en-CA`
 * @param skeleton - An ICU NumberFormatter pattern or `::`-prefixed skeleton
 *   string, or a parsed `Skeleton` structure
 * @param currency - If `skeleton` is a pattern string that includes ¤ tokens,
 *   their skeleton representation requires a three-letter currency code.
 * @param onError - If defined, will be called separately for each encountered
 *   parsing error and unsupported feature.
 * @example
 * ```js
 * import { getNumberFormatterSource } from '@messageformat/number-skeleton'
 *
 * getNumberFormatterSource('en', '::percent', console.error)
 * // '(function() {\n' +
 * // '  var opt = {"style":"percent"};\n' +
 * // '  var nf = new Intl.NumberFormat(["en"], opt);\n' +
 * // '  var mod = function(n) { return n * 0.01; };\n' +
 * // '  return function(value) { return nf.format(mod(value)); }\n' +
 * // '})()'
 *
 * const src = getNumberFormatterSource('en-CA', ':: currency/CAD unit-width-narrow', console.error)
 * // '(function() {\n' +
 * // '  var opt = {"style":"currency","currency":"CAD","currencyDisplay":"narrowSymbol","unitDisplay":"narrow"};\n' +
 * // '  var nf = new Intl.NumberFormat(["en-CA"], opt);\n'
 * // '  return function(value) { return nf.format(value); }\n' +
 * // '})()'
 * const fmt = new Function(`return ${src}`)()
 * fmt(42) // '$42.00'
 * ```
 */
export function getNumberFormatterSource(
  locales: string | string[],
  skeleton: string | Skeleton,
  currency?: string | null,
  onError?: (err: NumberFormatError) => void
) {
  if (typeof skeleton === 'string') {
    skeleton =
      skeleton.indexOf('::') === 0
        ? parseNumberSkeleton(skeleton.slice(2), onError)
        : parseNumberPattern(skeleton, currency, onError);
  }
  const lc = getNumberFormatLocales(locales, skeleton);
  const opt = getNumberFormatOptions(skeleton, onError);
  const modSrc = getNumberFormatModifierSource(skeleton);
  const lines = [
    `(function() {`,
    `var opt = ${JSON.stringify(opt)};`,
    `var nf = new Intl.NumberFormat(${JSON.stringify(lc)}, opt);`
  ];

  let res = 'nf.format(value)';
  if (modSrc) {
    lines.push(`var mod = ${modSrc};`);
    res = 'nf.format(mod(value))';
  }
  if (skeleton.affix) {
    const [p0, p1] = skeleton.affix.pos.map(s => JSON.stringify(s));
    if (skeleton.affix.neg) {
      const [n0, n1] = skeleton.affix.neg.map(s => JSON.stringify(s));
      res = `value < 0 ? ${n0} + ${res} + ${n1} : ${p0} + ${res} + ${p1}`;
    } else {
      res = `${p0} + ${res} + ${p1}`;
    }
  }
  lines.push(`return function(value) { return ${res}; }`);

  return lines.join('\n  ') + '\n})()';
}
