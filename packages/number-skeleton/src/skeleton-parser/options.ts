import {
  BadOptionError,
  MissingOptionError,
  NumberFormatError,
  TooManyOptionsError
} from '../errors.js';

const maxOptions = {
  'compact-short': 0,
  'compact-long': 0,
  'notation-simple': 0,
  scientific: 2,
  engineering: 2,
  percent: 0,
  permille: 0,
  'base-unit': 0,
  currency: 1,
  'measure-unit': 1,
  'per-measure-unit': 1,
  'unit-width-narrow': 0,
  'unit-width-short': 0,
  'unit-width-full-name': 0,
  'unit-width-iso-code': 0,
  'unit-width-hidden': 0,
  'precision-integer': 0,
  'precision-unlimited': 0,
  'precision-currency-standard': 1,
  'precision-currency-cash': 0,
  'precision-increment': 1,
  'rounding-mode-ceiling': 0,
  'rounding-mode-floor': 0,
  'rounding-mode-down': 0,
  'rounding-mode-up': 0,
  'rounding-mode-half-even': 0,
  'rounding-mode-half-down': 0,
  'rounding-mode-half-up': 0,
  'rounding-mode-unnecessary': 0,
  'integer-width': 1,
  scale: 1,
  'group-off': 0,
  'group-min2': 0,
  'group-auto': 0,
  'group-on-aligned': 0,
  'group-thousands': 0,
  latin: 0,
  'numbering-system': 1,
  'sign-auto': 0,
  'sign-always': 0,
  'sign-never': 0,
  'sign-accounting': 0,
  'sign-accounting-always': 0,
  'sign-except-zero': 0,
  'sign-accounting-except-zero': 0,
  'decimal-auto': 0,
  'decimal-always': 0
};

const minOptions = {
  currency: 1,
  'integer-width': 1,
  'measure-unit': 1,
  'numbering-system': 1,
  'per-measure-unit': 1,
  'precision-increment': 1,
  scale: 1
};

function hasMaxOption(stem: string): stem is keyof typeof maxOptions {
  return stem in maxOptions;
}

function hasMinOption(stem: string): stem is keyof typeof minOptions {
  return stem in minOptions;
}

/** @internal */
export function validOptions(
  stem: string,
  options: string[],
  onError: (err: NumberFormatError) => void
) {
  if (hasMaxOption(stem)) {
    const maxOpt = maxOptions[stem];
    if (options.length > maxOpt) {
      if (maxOpt === 0) {
        for (const opt of options) onError(new BadOptionError(stem, opt));
      } else {
        onError(new TooManyOptionsError(stem, options, maxOpt));
      }
      return false;
    } else if (hasMinOption(stem) && options.length < minOptions[stem]) {
      onError(new MissingOptionError(stem));
      return false;
    }
  }
  return true;
}
