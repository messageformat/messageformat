import {
  NumberFormatError,
  BadOptionError,
  BadStemError,
  MaskedValueError
} from '../errors.js';
import { isNumberingSystem, Skeleton } from '../types/skeleton.js';
import { isUnit } from '../types/unit.js';
import { validOptions } from './options.js';
import { parsePrecisionBlueprint } from './parse-precision-blueprint.js';

/** @internal */
export class TokenParser {
  onError: (err: NumberFormatError) => void;
  skeleton: Skeleton = {};

  constructor(onError: (err: NumberFormatError) => void) {
    this.onError = onError;
  }

  badOption(stem: string, opt: string) {
    this.onError(new BadOptionError(stem, opt));
  }

  assertEmpty(key: keyof Skeleton) {
    const prev = this.skeleton[key];
    if (prev) this.onError(new MaskedValueError(key, prev));
  }

  parseToken(stem: string, options: string[]) {
    if (!validOptions(stem, options, this.onError)) return;

    const option = options[0];
    const res = this.skeleton;

    switch (stem) {
      // notation
      case 'compact-short':
      case 'compact-long':
      case 'notation-simple':
        this.assertEmpty('notation');
        res.notation = { style: stem };
        break;
      case 'scientific':
      case 'engineering': {
        let expDigits = null;
        let expSign: Skeleton['sign'] = undefined;
        for (const opt of options) {
          switch (opt) {
            case 'sign-auto':
            case 'sign-always':
            case 'sign-never':
            case 'sign-accounting':
            case 'sign-accounting-always':
            case 'sign-except-zero':
            case 'sign-accounting-except-zero':
              expSign = opt;
              break;
            default:
              if (/^\+e+$/.test(opt)) expDigits = opt.length - 1;
              else {
                this.badOption(stem, opt);
              }
          }
        }
        this.assertEmpty('notation');
        const source = options.join('/');
        res.notation =
          expDigits && expSign
            ? { style: stem, source, expDigits, expSign }
            : expDigits
            ? { style: stem, source, expDigits }
            : expSign
            ? { style: stem, source, expSign }
            : { style: stem, source };
        break;
      }

      // unit
      case 'percent':
      case 'permille':
      case 'base-unit':
        this.assertEmpty('unit');
        res.unit = { style: stem };
        break;
      case 'currency':
        if (/^[A-Z]{3}$/.test(option)) {
          this.assertEmpty('unit');
          res.unit = { style: stem, currency: option };
        } else this.badOption(stem, option);
        break;
      case 'measure-unit': {
        if (isUnit(option)) {
          this.assertEmpty('unit');
          res.unit = { style: stem, unit: option };
        } else this.badOption(stem, option);
        break;
      }

      // unitPer
      case 'per-measure-unit': {
        if (isUnit(option)) {
          this.assertEmpty('unitPer');
          res.unitPer = option;
        } else this.badOption(stem, option);
        break;
      }

      // unitWidth
      case 'unit-width-narrow':
      case 'unit-width-short':
      case 'unit-width-full-name':
      case 'unit-width-iso-code':
      case 'unit-width-hidden':
        this.assertEmpty('unitWidth');
        res.unitWidth = stem;
        break;

      // precision
      case 'precision-integer':
      case 'precision-unlimited':
      case 'precision-currency-standard':
      case 'precision-currency-cash':
        this.assertEmpty('precision');
        res.precision = { style: stem };
        break;
      case 'precision-increment': {
        const increment = Number(option);
        if (increment > 0) {
          this.assertEmpty('precision');
          res.precision = { style: stem, increment };
        } else this.badOption(stem, option);
        break;
      }

      // roundingMode
      case 'rounding-mode-ceiling':
      case 'rounding-mode-floor':
      case 'rounding-mode-down':
      case 'rounding-mode-up':
      case 'rounding-mode-half-even':
      case 'rounding-mode-half-down':
      case 'rounding-mode-half-up':
      case 'rounding-mode-unnecessary':
        this.assertEmpty('roundingMode');
        res.roundingMode = stem;
        break;

      // integerWidth
      case 'integer-width': {
        if (/^\+0*$/.test(option)) {
          this.assertEmpty('integerWidth');
          res.integerWidth = { source: option, min: option.length - 1 };
        } else {
          const m = option.match(/^#*(0*)$/);
          if (m) {
            this.assertEmpty('integerWidth');
            res.integerWidth = {
              source: option,
              min: m[1].length,
              max: m[0].length
            };
          } else this.badOption(stem, option);
        }
        break;
      }

      // scale
      case 'scale': {
        const scale = Number(option);
        if (scale > 0) {
          this.assertEmpty('scale');
          res.scale = scale;
        } else this.badOption(stem, option);
        break;
      }

      // group
      case 'group-off':
      case 'group-min2':
      case 'group-auto':
      case 'group-on-aligned':
      case 'group-thousands':
        this.assertEmpty('group');
        res.group = stem;
        break;

      // numberingSystem
      case 'latin':
        this.assertEmpty('numberingSystem');
        res.numberingSystem = 'latn';
        break;
      case 'numbering-system': {
        if (isNumberingSystem(option)) {
          this.assertEmpty('numberingSystem');
          res.numberingSystem = option;
        } else this.badOption(stem, option);
        break;
      }

      // sign
      case 'sign-auto':
      case 'sign-always':
      case 'sign-never':
      case 'sign-accounting':
      case 'sign-accounting-always':
      case 'sign-except-zero':
      case 'sign-accounting-except-zero':
        this.assertEmpty('sign');
        res.sign = stem;
        break;

      // decimal
      case 'decimal-auto':
      case 'decimal-always':
        this.assertEmpty('decimal');
        res.decimal = stem;
        break;

      // precision blueprint
      default: {
        const precision = parsePrecisionBlueprint(stem, options, this.onError);
        if (precision) {
          this.assertEmpty('precision');
          res.precision = precision;
        } else {
          this.onError(new BadStemError(stem));
        }
      }
    }
  }
}
