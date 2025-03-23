import { UnsupportedError } from '../errors';
import { Skeleton } from '../types/skeleton';
import { NumberFormatOptions, getNumberFormatOptions } from './options';

interface TestCase {
  skeleton: Skeleton;
  result?: NumberFormatOptions;
  unsupported?: string[][];
}

const tests: { [K in keyof Skeleton]: { [name: string]: TestCase } } = {
  unit: {
    'base-unit': {
      skeleton: { unit: { style: 'base-unit' } },
      result: { style: 'decimal' }
    },
    currency: {
      skeleton: { unit: { style: 'currency', currency: 'EUR' } },
      result: { style: 'currency', currency: 'EUR' }
    },
    'measure-unit': {
      skeleton: { unit: { style: 'measure-unit', unit: 'length-meter' } },
      result: { style: 'unit', unit: 'meter' }
    },
    'measure-unit + per-measure-unit': {
      skeleton: {
        unit: { style: 'measure-unit', unit: 'length-meter' },
        unitPer: 'duration-second'
      },
      result: { style: 'unit', unit: 'meter-per-second' }
    },
    percent: {
      skeleton: { unit: { style: 'percent' } },
      result: { style: 'unit', unit: 'percent' }
    },
    'percent scale/100': {
      skeleton: { unit: { style: 'percent' }, scale: 100 },
      result: { style: 'percent' }
    },
    permille: {
      skeleton: { unit: { style: 'permille' } },
      unsupported: [['permille']]
    }
  },

  unitWidth: {
    'unit-width-full-name': {
      skeleton: { unitWidth: 'unit-width-full-name' },
      result: { currencyDisplay: 'name', unitDisplay: 'long' }
    },
    'unit-width-hidden': {
      skeleton: { unitWidth: 'unit-width-hidden' },
      unsupported: [['unit-width-hidden']]
    },
    'unit-width-iso-code': {
      skeleton: { unitWidth: 'unit-width-iso-code' },
      result: { currencyDisplay: 'code' }
    },
    'unit-width-narrow': {
      skeleton: { unitWidth: 'unit-width-narrow' },
      result: { currencyDisplay: 'narrowSymbol', unitDisplay: 'narrow' }
    },
    'unit-width-short': {
      skeleton: { unitWidth: 'unit-width-short' },
      result: { currencyDisplay: 'symbol', unitDisplay: 'short' }
    }
  },

  group: {
    'group-auto': {
      skeleton: { group: 'group-auto' },
      result: { useGrouping: 'auto' }
    },
    'group-off': {
      skeleton: { group: 'group-off' },
      result: { useGrouping: false }
    },
    'group-min2': {
      skeleton: { group: 'group-min2' },
      result: { useGrouping: 'min2' }
    },
    'group-on-aligned': {
      skeleton: { group: 'group-on-aligned' },
      result: { useGrouping: 'always' },
      unsupported: [['group-on-aligned']]
    },
    'group-thousands': {
      skeleton: { group: 'group-thousands' },
      result: { useGrouping: 'always' },
      unsupported: [['group-thousands']]
    }
  },

  integerWidth: {
    min: {
      skeleton: { integerWidth: { min: 2 } },
      result: { minimumIntegerDigits: 2 }
    },
    max: {
      skeleton: { integerWidth: { min: 0, max: 2, source: 'SRC' } },
      unsupported: [['integer-width', 'SRC']]
    }
  },

  precision: {
    'precision-fraction fraction digits': {
      skeleton: {
        precision: {
          style: 'precision-fraction',
          minFraction: 2,
          maxFraction: 4
        }
      },
      result: { minimumFractionDigits: 2, maximumFractionDigits: 4 }
    },
    'precision-fraction significant digits': {
      skeleton: {
        precision: {
          style: 'precision-fraction',
          minSignificant: 2,
          maxSignificant: 4
        }
      },
      result: { minimumSignificantDigits: 2, maximumSignificantDigits: 4 }
    },
    'precision-fraction both': {
      skeleton: {
        precision: {
          style: 'precision-fraction',
          minFraction: 2,
          maxFraction: 4,
          minSignificant: 3,
          maxSignificant: 6,
          source: 'SRC'
        }
      },
      result: {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
        minimumSignificantDigits: 3,
        maximumSignificantDigits: 6
      },
      unsupported: [['precision-fraction', 'SRC']]
    },
    'precision-integer': {
      skeleton: { precision: { style: 'precision-integer' } },
      result: { maximumFractionDigits: 0 }
    },
    'precision-unlimited': {
      skeleton: { precision: { style: 'precision-unlimited' } },
      result: { maximumFractionDigits: 20 }
    },
    'precision-increment': {
      skeleton: { precision: { style: 'precision-increment', increment: 2 } },
      result: {
        roundingIncrement: 2,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    },
    'precision-currency-standard': {
      skeleton: { precision: { style: 'precision-currency-standard' } },
      result: {}
    },
    'precision-currency-standard/w': {
      skeleton: {
        precision: {
          style: 'precision-currency-standard',
          trailingZero: 'stripIfInteger'
        }
      },
      result: { trailingZeroDisplay: 'stripIfInteger' }
    },
    'precision-currency-cash': {
      skeleton: { precision: { style: 'precision-currency-cash' } },
      unsupported: [['precision-currency-cash']]
    }
  },

  notation: {
    'compact-short': {
      skeleton: { notation: { style: 'compact-short' } },
      result: { notation: 'compact', compactDisplay: 'short' }
    },
    'compact-long': {
      skeleton: { notation: { style: 'compact-long' } },
      result: { notation: 'compact', compactDisplay: 'long' }
    },
    'notation-simple': {
      skeleton: { notation: { style: 'notation-simple' } },
      result: { notation: 'standard' }
    },
    scientific: {
      skeleton: { notation: { style: 'scientific' } },
      result: { notation: 'scientific' }
    },
    'scientific sign-accounting': {
      skeleton: {
        notation: {
          style: 'scientific',
          expSign: 'sign-accounting',
          source: 'SRC'
        }
      },
      result: { notation: 'scientific' },
      unsupported: [['scientific', 'SRC']]
    },
    engineering: {
      skeleton: { notation: { style: 'engineering', source: 'STR' } },
      result: { notation: 'engineering' }
    },
    'engineering expDigits': {
      skeleton: {
        notation: { style: 'engineering', expDigits: 2, source: 'SRC' }
      },
      result: { notation: 'engineering' },
      unsupported: [['engineering', 'SRC']]
    }
  },

  sign: {
    'sign-auto': {
      skeleton: { sign: 'sign-auto' },
      result: { signDisplay: 'auto' }
    },
    'sign-always': {
      skeleton: { sign: 'sign-always' },
      result: { signDisplay: 'always' }
    },
    'sign-except-zero': {
      skeleton: { sign: 'sign-except-zero' },
      result: { signDisplay: 'exceptZero' }
    },
    'sign-never': {
      skeleton: { sign: 'sign-never' },
      result: { signDisplay: 'never' }
    },
    'sign-accounting': {
      skeleton: { sign: 'sign-accounting' },
      result: { currencySign: 'accounting' }
    },
    'sign-accounting-always': {
      skeleton: { sign: 'sign-accounting-always' },
      result: { currencySign: 'accounting', signDisplay: 'always' }
    },
    'sign-accounting-except-zero': {
      skeleton: { sign: 'sign-accounting-except-zero' },
      result: { currencySign: 'accounting', signDisplay: 'exceptZero' }
    }
  },

  decimal: {
    'decimal-auto': {
      skeleton: { decimal: 'decimal-auto' },
      result: {}
    },
    'decimal-always': {
      skeleton: { decimal: 'decimal-always' },
      unsupported: [['decimal-always']]
    }
  },

  roundingMode: {
    'rounding-mode-ceiling': {
      skeleton: { roundingMode: 'rounding-mode-ceiling' },
      result: { roundingMode: 'ceil' }
    },
    'rounding-mode-floor': {
      skeleton: { roundingMode: 'rounding-mode-floor' },
      result: { roundingMode: 'floor' }
    },
    'rounding-mode-down': {
      skeleton: { roundingMode: 'rounding-mode-down' },
      result: { roundingMode: 'trunc' }
    },
    'rounding-mode-up': {
      skeleton: { roundingMode: 'rounding-mode-up' },
      result: { roundingMode: 'expand' }
    },
    'rounding-mode-half-even': {
      skeleton: { roundingMode: 'rounding-mode-half-even' },
      result: { roundingMode: 'halfEven' }
    },
    'rounding-mode-half-down': {
      skeleton: { roundingMode: 'rounding-mode-half-down' },
      result: { roundingMode: 'halfTrunc' }
    },
    'rounding-mode-half-up': {
      skeleton: { roundingMode: 'rounding-mode-half-up' },
      result: { roundingMode: 'halfExpand' }
    },
    'rounding-mode-unnecessary': {
      skeleton: { roundingMode: 'rounding-mode-unnecessary' },
      unsupported: [['rounding-mode-unnecessary']]
    }
  }
};

for (const [testSet, cases] of Object.entries(tests)) {
  if (!cases) continue;
  describe(testSet, () => {
    for (const [name, data] of Object.entries(cases)) {
      const { skeleton, result, unsupported } = data;
      test(name, () => {
        const cb = jest.fn();
        const opt = getNumberFormatOptions(skeleton, cb, []);
        expect(opt).toEqual(result || {});
        if (unsupported) {
          const errors = unsupported.map(([stem, source]) => [
            new UnsupportedError(stem, source)
          ]);
          expect(cb.mock.calls).toEqual(errors);
        } else {
          expect(cb).not.toHaveBeenCalled();
        }
      });
    }
  });
}
