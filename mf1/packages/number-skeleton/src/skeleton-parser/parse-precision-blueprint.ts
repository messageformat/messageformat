import {
  BadOptionError,
  NumberFormatError,
  TooManyOptionsError
} from '../errors.js';
import { Skeleton } from '../types/skeleton.js';

function parseFractionDigits(
  src: string
): { minFraction: number; maxFraction?: number } | null {
  const match = src?.match(/^\.(0*)([+*]|#*)$/);
  if (!match) return null;
  const min = match[1].length;
  switch (match[2].charAt(0)) {
    case '+':
    case '*':
      return { minFraction: min };
    case '#':
      return { minFraction: min, maxFraction: min + match[2].length };
    default:
      return { minFraction: min, maxFraction: min };
  }
}

function parseSignificantDigits(src: string): {
  minSignificant: number;
  maxSignificant?: number;
  roundingPriority?: 'relaxed' | 'strict';
} | null {
  const match = src?.match(/^(@+)([+*]|#*([sr]?))$/);
  if (!match) return null;
  const min = match[1].length;
  switch (match[2].charAt(0)) {
    case '+':
    case '*':
      return { minSignificant: min };
    case '#': {
      const max = min + match[2].length;
      switch (match[3]) {
        case 'r':
          return {
            minSignificant: min,
            maxSignificant: max - 1,
            roundingPriority: 'relaxed'
          };
        case 's':
          return {
            minSignificant: min,
            maxSignificant: max - 1,
            roundingPriority: 'strict'
          };
        default:
          return { minSignificant: min, maxSignificant: max };
      }
    }
    default:
      return { minSignificant: min, maxSignificant: min };
  }
}

export function parsePrecisionBlueprint(
  stem: string,
  options: string[],
  onError: (err: NumberFormatError) => void
) {
  const res: Skeleton['precision'] = {
    style: 'precision-fraction',
    source: [stem, ...options].join('/')
  };

  const fd = parseFractionDigits(stem);
  if (fd) {
    Object.assign(res, fd);
    if (options.length > 2) onError(new TooManyOptionsError(stem, options, 2));
    for (const option of options) {
      if (option === 'w') {
        if (res.trailingZero) onError(new BadOptionError(stem, option));
        else res.trailingZero = 'stripIfInteger';
      } else {
        const sd = parseSignificantDigits(option);
        if (sd && !('minSignificant' in res)) Object.assign(res, sd);
        else onError(new BadOptionError(stem, option));
      }
    }
    return res;
  }

  const sd = parseSignificantDigits(stem);
  if (sd) {
    Object.assign(res, sd);
    if (options.length > 1) {
      onError(new TooManyOptionsError(stem, options, 1));
    } else if (options.length === 1) {
      if (options[0] === 'w') res.trailingZero = 'stripIfInteger';
      else onError(new BadOptionError(stem, options[0]));
    }
    return res;
  }

  return null;
}
