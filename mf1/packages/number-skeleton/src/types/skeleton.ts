import { Unit } from './unit.js';

/**
 * An object representation of a parsed string skeleton, with token values
 * grouped by type.
 *
 * @public
 */
export interface Skeleton {
  /**
   * @remarks
   * The prefix and suffix of an ICU NumberFormatter pattern. Not used for skeletons.
   */
  affix?: { pos: [string, string]; neg?: [string, string] };
  decimal?: 'decimal-auto' | 'decimal-always';
  group?:
    | 'group-off'
    | 'group-min2'
    | 'group-auto'
    | 'group-on-aligned'
    | 'group-thousands';
  integerWidth?: { min: number; max?: number; source?: string };
  notation?:
    | { style: 'compact-short' | 'compact-long' | 'notation-simple' }
    | {
        style: 'scientific' | 'engineering';
        expDigits?: number;
        expSign?: Skeleton['sign'];
        source?: string;
      };
  /**
   * @remarks
   * List collected from
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat | MDN documentation}
   */
  numberingSystem?:
    | 'arab'
    | 'arabext'
    | 'bali'
    | 'beng'
    | 'deva'
    | 'fullwide'
    | 'gujr'
    | 'guru'
    | 'hanidec'
    | 'khmr'
    | 'knda'
    | 'laoo'
    | 'latn'
    | 'limb'
    | 'mlym'
    | 'mong'
    | 'mymr'
    | 'orya'
    | 'tamldec'
    | 'telu'
    | 'thai'
    | 'tibt';
  precision?:
    | {
        style:
          | 'precision-integer'
          | 'precision-unlimited'
          | 'precision-currency-cash'
          | 'precision-currency-standard';
        trailingZero?: 'auto' | 'stripIfInteger';
      }
    | {
        style: 'precision-increment';
        increment: number;
        trailingZero?: 'auto' | 'stripIfInteger';
      }
    | {
        style: 'precision-fraction';
        minFraction?: number;
        maxFraction?: number;
        minSignificant?: number;
        maxSignificant?: number;
        roundingPriority?: 'relaxed' | 'strict';
        trailingZero?: 'auto' | 'stripIfInteger';
        source?: string;
      };
  roundingMode?:
    | 'rounding-mode-ceiling'
    | 'rounding-mode-floor'
    | 'rounding-mode-down'
    | 'rounding-mode-up'
    | 'rounding-mode-half-even'
    | 'rounding-mode-half-odd'
    | 'rounding-mode-half-ceiling'
    | 'rounding-mode-half-floor'
    | 'rounding-mode-half-down'
    | 'rounding-mode-half-up'
    | 'rounding-mode-unnecessary';
  scale?: number;
  sign?:
    | 'sign-auto'
    | 'sign-always'
    | 'sign-never'
    | 'sign-accounting'
    | 'sign-accounting-always'
    | 'sign-except-zero'
    | 'sign-accounting-except-zero'
    | 'sign-negative'
    | 'sign-accounting-negative';
  unit?:
    | { style: 'percent' | 'permille' | 'base-unit' }
    | { style: 'currency'; currency: string }
    | { style: 'measure-unit'; unit: Unit }
    | { style: 'concise-unit'; unit: string };
  unitPer?: Unit;
  unitWidth?:
    | 'unit-width-narrow'
    | 'unit-width-short'
    | 'unit-width-full-name'
    | 'unit-width-iso-code'
    | 'unit-width-hidden';
}

/** @internal */
export function isNumberingSystem(
  ns: string
): ns is string & Skeleton['numberingSystem'] {
  const systems = [
    'arab',
    'arabext',
    'bali',
    'beng',
    'deva',
    'fullwide',
    'gujr',
    'guru',
    'hanidec',
    'khmr',
    'knda',
    'laoo',
    'latn',
    'limb',
    'mlym',
    'mong',
    'mymr',
    'orya',
    'tamldec',
    'telu',
    'thai',
    'tibt'
  ];
  return systems.indexOf(ns) !== -1;
}
