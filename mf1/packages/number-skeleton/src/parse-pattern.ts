import { Skeleton } from './types/skeleton.js';
import { AffixToken } from './pattern-parser/affix-tokens.js';
import { parseTokens } from './pattern-parser/parse-tokens.js';
import { parseNumberAsSkeleton } from './pattern-parser/number-as-skeleton.js';
import { NumberFormatError, PatternError } from './errors.js';

function handleAffix(
  affixTokens: AffixToken[],
  res: Skeleton,
  currency: string | null | undefined,
  onError: (error: PatternError) => void,
  isPrefix: boolean
) {
  let inFmt = false;
  let str = '';
  for (const token of affixTokens) {
    switch (token.char) {
      case '%':
        res.unit = { style: token.style };
        if (isPrefix) inFmt = true;
        else str = '';
        break;

      case '¤':
        if (!currency) {
          const msg = `The ¤ pattern requires a currency`;
          onError(new PatternError('¤', msg));
          break;
        }
        res.unit = { style: 'currency', currency };
        switch (token.currency) {
          case 'iso-code':
            res.unitWidth = 'unit-width-iso-code';
            break;
          case 'full-name':
            res.unitWidth = 'unit-width-full-name';
            break;
          case 'narrow':
            res.unitWidth = 'unit-width-narrow';
            break;
        }
        if (isPrefix) inFmt = true;
        else str = '';
        break;

      case '*':
        // TODO
        break;

      case '+':
        if (!inFmt) str += '+';
        break;

      case "'":
        if (!inFmt) str += token.str;
        break;
    }
  }
  return str;
}

function getNegativeAffix(affixTokens: AffixToken[], isPrefix: boolean) {
  let inFmt = false;
  let str = '';
  for (const token of affixTokens) {
    switch (token.char) {
      case '%':
      case '¤':
        if (isPrefix) inFmt = true;
        else str = '';
        break;
      case '-':
        if (!inFmt) str += '-';
        break;
      case "'":
        if (!inFmt) str += token.str;
        break;
    }
  }
  return str;
}

/**
 * Parse an {@link
 * http://unicode.org/reports/tr35/tr35-numbers.html#Number_Format_Patterns |
 * ICU NumberFormatter pattern} string into a {@link Skeleton} structure.
 *
 * @public
 * @param src - The pattern string
 * @param currency - If the pattern includes ¤ tokens, their skeleton
 *   representation requires a three-letter currency code.
 * @param onError - Called when the parser encounters a syntax error. The
 *   function will still return a {@link Skeleton}, but it will be incomplete
 *   and/or inaccurate. If not defined, the error will be thrown instead.
 *
 * @remarks
 * Unlike the skeleton parser, the pattern parser is not able to return partial
 * results on error, and will instead throw. Output padding is not supported.
 *
 * @example
 * ```js
 * import { parseNumberPattern } from '@messageformat/number-skeleton'
 *
 * parseNumberPattern('#,##0.00 ¤', 'EUR', console.error)
 * // {
 * //   group: 'group-auto',
 * //   precision: {
 * //     style: 'precision-fraction',
 * //     minFraction: 2,
 * //     maxFraction: 2
 * //   },
 * //   unit: { style: 'currency', currency: 'EUR' }
 * // }
 * ```
 */
export function parseNumberPattern(
  src: string,
  currency?: string | null,
  onError: (error: NumberFormatError) => void = error => {
    throw error;
  }
) {
  const { tokens, negative } = parseTokens(src, onError);
  const res = parseNumberAsSkeleton(tokens.number, onError);

  const prefix = handleAffix(tokens.prefix, res, currency, onError, true);
  const suffix = handleAffix(tokens.suffix, res, currency, onError, false);
  if (negative) {
    const negPrefix = getNegativeAffix(negative.prefix, true);
    const negSuffix = getNegativeAffix(negative.suffix, false);
    res.affix = { pos: [prefix, suffix], neg: [negPrefix, negSuffix] };
    res.sign = 'sign-never';
  } else if (prefix || suffix) {
    res.affix = { pos: [prefix, suffix] };
  }

  return res;
}
