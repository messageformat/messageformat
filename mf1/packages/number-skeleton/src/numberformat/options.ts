import type { Skeleton } from '../types/skeleton.js';

const isRoundingIncrement = (
  n: number
): n is Exclude<Intl.NumberFormatOptions['roundingIncrement'], undefined> =>
  [
    1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000
  ].includes(n);

/**
 * Given an input ICU NumberFormatter skeleton,
 * constructs a corresponding `Intl.NumberFormat` options structure.
 *
 * @public
 * @param onError - Called if encountering unsupported (but valid) tokens,
 *   such as `decimal-always` or `precision-increment/0.05`.
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
 * const sk2 = parseNumberSkeleton('decimal-always')
 * // { decimal: 'decimal-always' }
 *
 * getNumberFormatOptions(sk2, console.error)
 * // prints: ['decimal-always']
 * // {}
 * ```
 */
export function getNumberFormatOptions(
  skeleton: Skeleton,
  onError: (stem: string, options?: string) => void
): Intl.NumberFormatOptions {
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
  const opt: Intl.NumberFormatOptions = {};

  if (numberingSystem) {
    if (Intl.supportedValuesOf('numberingSystem').includes(numberingSystem)) {
      opt.numberingSystem = numberingSystem;
    } else {
      onError('numbering-system', numberingSystem);
    }
  }

  switch (unit?.style) {
    case 'base-unit':
      opt.style = 'decimal';
      break;
    case 'currency':
      opt.style = 'currency';
      opt.currency = unit.currency;
      break;
    case 'measure-unit': {
      opt.style = 'unit';
      const jsUnit = unit.unit.replace(/^[^-]+-/, '');
      if (Intl.supportedValuesOf('unit').includes(jsUnit)) opt.unit = jsUnit;
      else onError(unit.style, unit.unit);
      break;
    }
    case 'concise-unit': {
      opt.style = 'unit';
      const supported = Intl.supportedValuesOf('unit');
      if (unit.unit.split('-per-').every(part => supported.includes(part))) {
        opt.unit = unit.unit;
      } else {
        onError(unit.style, unit.unit);
      }
      break;
    }
    case 'percent':
      if (scale === 100) {
        opt.style = 'percent';
      } else if (!scale || scale === 1) {
        opt.style = 'unit';
        opt.unit = 'percent';
      } else {
        onError('scale');
      }
      break;
    case 'permille':
    default:
      if (unit) onError(unit.style);
  }

  if (unitPer) {
    const jsUnitPer = unitPer.replace(/^[^-]+-/, '');
    if (
      opt.unit &&
      !opt.unit.includes('-per-') &&
      Intl.supportedValuesOf('unit').includes(jsUnitPer)
    ) {
      opt.unit += '-per-' + jsUnitPer;
    } else {
      onError('per-measure-unit', unitPer);
    }
  }

  if (opt.style !== 'percent' && scale && scale !== 1) {
    onError('scale', String(scale));
  }

  switch (unitWidth) {
    case 'unit-width-full-name':
      opt.currencyDisplay = 'name';
      opt.unitDisplay = 'long';
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
    case 'unit-width-hidden':
    default:
      if (unitWidth) onError(unitWidth);
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
    default:
      if (group) onError(group);
  }

  switch (precision?.style) {
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
        if (typeof minS === 'number') onError('precision-fraction', source);
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
        onError(precision.style);
      }
      break;
    }
    case 'precision-currency-standard':
      break;
    case 'precision-currency-cash':
    default:
      if (precision) onError(precision.style);
  }
  if (precision?.trailingZero) {
    opt.trailingZeroDisplay = precision.trailingZero;
  }

  switch (notation?.style) {
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
        onError(style, source);
      }
      break;
    }
    default:
      // @ts-expect-error Future-proofing
      if (notation) onError(notation.style);
  }

  if (integerWidth) {
    const { min, max, source } = integerWidth;
    if (min) opt.minimumIntegerDigits = min;
    if (max) {
      const hasExp =
        opt.notation === 'engineering' || opt.notation === 'scientific';
      if (max === 3 && hasExp) opt.notation = 'engineering';
      else onError('integer-width', source);
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
    default:
      if (sign) fail(sign);
  }

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
      if (roundingMode) onError(roundingMode);
  }

  if (affix) onError('affix');
  if (decimal === 'decimal-always') onError(decimal);

  return opt;
}
