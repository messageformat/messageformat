import { UnsupportedError } from '../errors.js';
import { Skeleton } from '../types/skeleton.js';

/**
 * Extends `Intl.NumberFormat` options to include some features brought by the
 * {@link https://github.com/tc39/proposal-intl-numberformat-v3 | ECMA-402
 * Proposal: Intl.NumberFormat V3}
 *
 * @internal
 */
export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  trailingZeroDisplay?: 'auto' | 'stripIfInteger';
}

const isRoundingIncrement = (
  n: number
): n is Exclude<NumberFormatOptions['roundingIncrement'], undefined> =>
  [
    1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000
  ].includes(n);

/**
 * Given an input ICU NumberFormatter skeleton, does its best to construct a
 * corresponding `Intl.NumberFormat` options structure.
 *
 * @internal
 * @param onUnsupported - If defined, called when encountering unsupported (but
 *   valid) tokens, such as `decimal-always` or `permille`. The error `source`
 *   may specify the source of an unsupported option.
 *
 * @example
 * ```js
 * import {
 *   getNumberFormatOptions,
 *   parseNumberSkeleton
 * } from '@messageformat/number-skeleton'
 *
 * const src = 'currency/CAD unit-width-narrow'
 * const skeleton = parseNumberSkeleton(src, console.error)
 * // {
 * //   unit: { style: 'currency', currency: 'CAD' },
 * //   unitWidth: 'unit-width-narrow'
 * // }
 *
 * getNumberFormatOptions(skeleton, console.error)
 * // {
 * //   style: 'currency',
 * //   currency: 'CAD',
 * //   currencyDisplay: 'narrowSymbol',
 * //   unitDisplay: 'narrow'
 * // }
 *
 * const sk2 = parseNumberSkeleton('group-min2')
 * // { group: 'group-min2' }
 *
 * getNumberFormatOptions(sk2, console.error)
 * // Error: The stem group-min2 is not supported
 * //   at UnsupportedError.NumberFormatError ... {
 * //     code: 'UNSUPPORTED',
 * //     stem: 'group-min2'
 * //   }
 * // {}
 * ```
 */
export function getNumberFormatOptions(
  skeleton: Skeleton,
  onUnsupported: ((err: UnsupportedError) => void) | undefined,
  ignoreUnsupported: string[]
) {
  const {
    affix,
    decimal,
    group,
    integerWidth,
    notation,
    numberingSystem,
    precision,
    roundingMode,
    scale,
    sign,
    unit,
    unitPer,
    unitWidth
  } = skeleton;
  const fail = (stem: string, source?: string) => {
    if (onUnsupported && !ignoreUnsupported.includes(stem)) {
      onUnsupported(new UnsupportedError(stem, source));
    }
  };

  const opt: NumberFormatOptions = {};

  if (numberingSystem) opt.numberingSystem = numberingSystem;

  if (unit) {
    switch (unit.style) {
      case 'base-unit':
        opt.style = 'decimal';
        break;
      case 'currency':
        opt.style = 'currency';
        opt.currency = unit.currency;
        break;
      case 'measure-unit':
        opt.style = 'unit';
        opt.unit = unit.unit.replace(/.*-/, '');
        if (unitPer) opt.unit += '-per-' + unitPer.replace(/.*-/, '');
        break;
      case 'concise-unit':
        opt.style = 'unit';
        opt.unit = unit.unit;
        break;
      case 'percent':
        if (scale === 100) {
          opt.style = 'percent';
        } else if (!scale || scale === 1) {
          opt.style = 'unit';
          opt.unit = 'percent';
        } else {
          fail('scale');
        }
        break;
      case 'permille':
        fail('permille');
        break;
    }
  }

  if (opt.style !== 'percent' && scale && scale !== 1) fail('scale');

  switch (unitWidth) {
    case 'unit-width-full-name':
      opt.currencyDisplay = 'name';
      opt.unitDisplay = 'long';
      break;
    case 'unit-width-hidden':
      fail(unitWidth);
      break;
    case 'unit-width-iso-code':
      opt.currencyDisplay = 'code';
      break;
    case 'unit-width-narrow':
      opt.currencyDisplay = 'narrowSymbol';
      opt.unitDisplay = 'narrow';
      break;
    case 'unit-width-short':
      opt.currencyDisplay = 'symbol';
      opt.unitDisplay = 'short';
      break;
  }

  switch (group) {
    case 'group-off':
      opt.useGrouping = false;
      break;
    case 'group-auto':
      opt.useGrouping = 'auto';
      break;
    case 'group-min2':
      opt.useGrouping = 'min2';
      break;
    case 'group-on-aligned':
    case 'group-thousands':
      fail(group);
      opt.useGrouping = 'always';
      break;
  }

  if (precision) {
    switch (precision.style) {
      case 'precision-fraction': {
        const {
          minFraction: minF,
          maxFraction: maxF,
          minSignificant: minS,
          maxSignificant: maxS,
          source
        } = precision;
        if (typeof minF === 'number') {
          opt.minimumFractionDigits = minF;
          if (typeof minS === 'number') fail('precision-fraction', source);
        }
        if (typeof maxF === 'number') opt.maximumFractionDigits = maxF;
        if (typeof minS === 'number') opt.minimumSignificantDigits = minS;
        if (typeof maxS === 'number') opt.maximumSignificantDigits = maxS;
        break;
      }
      case 'precision-integer':
        opt.maximumFractionDigits = 0;
        break;
      case 'precision-unlimited':
        opt.maximumFractionDigits = 20;
        break;
      case 'precision-increment': {
        const inc = precision.increment;
        if (isRoundingIncrement(inc)) {
          opt.roundingIncrement = inc;
          opt.maximumFractionDigits = 0;
          opt.minimumFractionDigits = 0;
        } else {
          fail(precision.style);
        }
        break;
      }
      case 'precision-currency-standard':
        break;
      case 'precision-currency-cash':
        fail(precision.style);
        break;
    }
    opt.trailingZeroDisplay = precision.trailingZero;
  }

  if (notation) {
    switch (notation.style) {
      case 'compact-short':
        opt.notation = 'compact';
        opt.compactDisplay = 'short';
        break;
      case 'compact-long':
        opt.notation = 'compact';
        opt.compactDisplay = 'long';
        break;
      case 'notation-simple':
        opt.notation = 'standard';
        break;
      case 'scientific':
      case 'engineering': {
        const { expDigits, expSign, source, style } = notation;
        opt.notation = style;
        if (
          (expDigits && expDigits > 1) ||
          (expSign && expSign !== 'sign-auto')
        ) {
          fail(style, source);
        }
        break;
      }
    }
  }

  if (integerWidth) {
    const { min, max, source } = integerWidth;
    if (min) opt.minimumIntegerDigits = min;
    if (max) {
      const hasExp =
        opt.notation === 'engineering' || opt.notation === 'scientific';
      if (max === 3 && hasExp) opt.notation = 'engineering';
      else fail('integer-width', source);
    }
  }

  switch (sign) {
    case 'sign-auto':
      opt.signDisplay = 'auto';
      break;
    case 'sign-always':
      opt.signDisplay = 'always';
      break;
    case 'sign-except-zero':
      opt.signDisplay = 'exceptZero';
      break;
    case 'sign-never':
      opt.signDisplay = 'never';
      break;
    case 'sign-accounting':
      opt.currencySign = 'accounting';
      break;
    case 'sign-accounting-always':
      opt.currencySign = 'accounting';
      opt.signDisplay = 'always';
      break;
    case 'sign-accounting-except-zero':
      opt.currencySign = 'accounting';
      opt.signDisplay = 'exceptZero';
      break;
    case 'sign-negative':
      opt.signDisplay = 'negative';
      break;
    case 'sign-accounting-negative':
      opt.currencySign = 'accounting';
      opt.signDisplay = 'negative';
      break;
  }

  if (roundingMode) {
    switch (roundingMode) {
      case 'rounding-mode-ceiling':
        opt.roundingMode = 'ceil';
        break;
      case 'rounding-mode-floor':
        opt.roundingMode = 'floor';
        break;
      case 'rounding-mode-down':
        opt.roundingMode = 'trunc';
        break;
      case 'rounding-mode-up':
        opt.roundingMode = 'expand';
        break;
      case 'rounding-mode-half-even':
        opt.roundingMode = 'halfEven';
        break;
      case 'rounding-mode-half-ceiling':
        opt.roundingMode = 'halfCeil';
        break;
      case 'rounding-mode-half-floor':
        opt.roundingMode = 'halfFloor';
        break;
      case 'rounding-mode-half-down':
        opt.roundingMode = 'halfTrunc';
        break;
      case 'rounding-mode-half-up':
        opt.roundingMode = 'halfExpand';
        break;
      default:
        fail(roundingMode);
    }
  }

  if (affix) fail('affix');
  if (decimal === 'decimal-always') fail(decimal);

  return opt;
}
