import {
  BadOptionError,
  BadStemError,
  MaskedValueError,
  MissingOptionError,
  NumberFormatError,
  TooManyOptionsError
} from '../errors.js';
import { Skeleton, isNumberingSystem } from '../types/skeleton.js';
import { isUnit } from '../types/unit.js';
import { parsePrecisionBlueprint } from './parse-precision-blueprint.js';

/** @internal */
export class TokenParser {
  #error: (err: NumberFormatError) => void;
  skeleton: Skeleton = {};

  constructor(onError: (err: NumberFormatError) => void) {
    this.#error = onError;
  }

  parseToken(stem: string, options: string[]) {
    const ok = (key: keyof Skeleton, min: number, max: number) => {
      const prev = this.skeleton[key];
      if (prev) this.#error(new MaskedValueError(key, prev));
      if (options.length > max) {
        if (max === 0) {
          for (const opt of options) this.#error(new BadOptionError(stem, opt));
        } else {
          this.#error(new TooManyOptionsError(stem, options, max));
        }
        return false;
      } else if (options.length < min) {
        this.#error(new MissingOptionError(stem));
        return false;
      }
      return true;
    };

    const option = options[0];
    const res = this.skeleton;

    switch (stem) {
      // notation
      case 'compact-short':
      case 'compact-long':
      case 'notation-simple':
        if (ok('notation', 0, 0)) res.notation = { style: stem };
        break;
      case 'K':
        if (ok('notation', 0, 0)) res.notation = { style: 'compact-short' };
        break;
      case 'KK':
        if (ok('notation', 0, 0)) res.notation = { style: 'compact-long' };
        break;
      case 'scientific':
      case 'engineering': {
        if (!ok('notation', 0, 2)) return;
        let expDigits: number | undefined = undefined;
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
              if (/^[+*]e+$/.test(opt)) {
                expDigits = opt.length - 1;
              } else {
                this.#error(new BadOptionError(stem, opt));
              }
          }
        }
        res.notation = {
          style: stem,
          source: options.join('/'),
          expDigits,
          expSign
        };
        break;
      }

      // unit
      case 'percent':
      case 'permille':
      case 'base-unit':
        if (ok('unit', 0, 0)) res.unit = { style: stem };
        break;
      case '%':
        if (ok('unit', 0, 0)) res.unit = { style: 'percent' };
        break;
      case '%x100':
        if (ok('unit', 0, 0)) res.unit = { style: 'percent' };
        if (ok('scale', 0, 0)) res.scale = 100;
        break;
      case 'currency':
        if (!ok('unit', 1, 1)) return;
        if (/^[A-Z]{3}$/.test(option)) {
          res.unit = { style: stem, currency: option };
        } else {
          this.#error(new BadOptionError(stem, option));
        }
        break;
      case 'measure-unit':
        if (ok('unit', 1, 1)) {
          if (isUnit(option)) res.unit = { style: stem, unit: option };
          else this.#error(new BadOptionError(stem, option));
        }
        break;
      case 'unit':
        if (ok('unit', 1, 1)) {
          res.unit = { style: 'concise-unit', unit: option };
        }
        break;

      // unitPer
      case 'per-measure-unit':
        if (ok('unitPer', 1, 1)) {
          if (isUnit(option)) res.unitPer = option;
          else this.#error(new BadOptionError(stem, option));
        }
        break;

      // unitWidth
      case 'unit-width-narrow':
      case 'unit-width-short':
      case 'unit-width-full-name':
      case 'unit-width-iso-code':
      case 'unit-width-hidden':
        if (ok('unitWidth', 0, 0)) res.unitWidth = stem;
        break;

      // precision
      case 'precision-integer':
      case 'precision-unlimited':
      case 'precision-currency-cash':
      case 'precision-currency-standard':
        if (ok('precision', 0, 1)) {
          res.precision = { style: stem };
          if (option === 'w') res.precision.trailingZero = 'stripIfInteger';
        }
        break;
      case 'precision-increment':
        if (ok('precision', 1, 1)) {
          const increment = Number(option);
          if (increment > 0) res.precision = { style: stem, increment };
          else this.#error(new BadOptionError(stem, option));
        }
        break;

      // roundingMode
      case 'rounding-mode-ceiling':
      case 'rounding-mode-floor':
      case 'rounding-mode-down':
      case 'rounding-mode-up':
      case 'rounding-mode-half-even':
      case 'rounding-mode-half-odd':
      case 'rounding-mode-half-ceiling':
      case 'rounding-mode-half-floor':
      case 'rounding-mode-half-down':
      case 'rounding-mode-half-up':
      case 'rounding-mode-unnecessary':
        if (ok('roundingMode', 0, 0)) res.roundingMode = stem;
        break;

      // integerWidth
      case 'integer-width': {
        if (!ok('integerWidth', 1, 1)) return;
        if (/^[+*]0*$/.test(option)) {
          res.integerWidth = { source: option, min: option.length - 1 };
        } else {
          const m = option.match(/^#*(0*)$/);
          if (m) {
            res.integerWidth = {
              source: option,
              min: m[1].length,
              max: m[0].length
            };
          } else {
            this.#error(new BadOptionError(stem, option));
          }
        }
        break;
      }
      case 'integer-width-trunc':
        if (ok('integerWidth', 0, 0)) {
          res.integerWidth = { source: option, min: 0, max: 0 };
        }
        break;

      // scale
      case 'scale':
        if (ok('scale', 1, 1)) {
          const scale = Number(option);
          if (scale > 0) res.scale = scale;
          else this.#error(new BadOptionError(stem, option));
        }
        break;

      // group
      case 'group-off':
      case 'group-min2':
      case 'group-auto':
      case 'group-on-aligned':
      case 'group-thousands':
        if (ok('group', 0, 0)) res.group = stem;
        break;
      case ',_':
        if (ok('group', 0, 0)) res.group = 'group-off';
        break;
      case ',?':
        if (ok('group', 0, 0)) res.group = 'group-min2';
        break;
      case ',!':
        if (ok('group', 0, 0)) res.group = 'group-on-aligned';
        break;

      // numberingSystem
      case 'latin':
        if (ok('numberingSystem', 0, 0)) res.numberingSystem = 'latn';
        break;
      case 'numbering-system': {
        if (ok('numberingSystem', 1, 1)) {
          if (isNumberingSystem(option)) res.numberingSystem = option;
          else this.#error(new BadOptionError(stem, option));
        }
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
      case 'sign-negative':
      case 'sign-accounting-negative':
        if (ok('sign', 0, 0)) res.sign = stem;
        break;
      case '+!':
        if (ok('sign', 0, 0)) res.sign = 'sign-always';
        break;
      case '+_':
        if (ok('sign', 0, 0)) res.sign = 'sign-never';
        break;
      case '()':
        if (ok('sign', 0, 0)) res.sign = 'sign-accounting';
        break;
      case '()!':
        if (ok('sign', 0, 0)) res.sign = 'sign-accounting-always';
        break;
      case '+-':
        if (ok('sign', 0, 0)) res.sign = 'sign-negative';
        break;
      case '()-':
        if (ok('sign', 0, 0)) res.sign = 'sign-accounting-negative';
        break;

      // decimal
      case 'decimal-auto':
      case 'decimal-always':
        if (ok('decimal', 0, 0)) res.decimal = stem;
        break;

      default: {
        const precision = parsePrecisionBlueprint(stem, options, this.#error);
        if (precision) {
          if (ok('precision', 0, 2)) res.precision = precision;
          break;
        }

        if (/^0+$/.test(stem)) {
          if (ok('integerWidth', 0, 0)) res.integerWidth = { min: stem.length };
          break;
        }

        const sciEng = stem.match(/^(EE?)(\+[!?])?(0+)$/);
        if (sciEng) {
          if (!ok('notation', 0, 0)) return;
          const style = sciEng[1] === 'EE' ? 'engineering' : 'scientific';
          const expSign = {
            '+!': 'sign-always' as const,
            '+?': 'sign-except-zero' as const
          }[sciEng[2]];
          const expDigits = sciEng[3].length;
          res.notation =
            expDigits === 1
              ? { style, expSign }
              : { style, expDigits, expSign };
          break;
        }

        this.#error(new BadStemError(stem));
      }
    }
  }
}
