import {
  NumberFormatError,
  MaskedValueError,
  PatternError
} from '../errors.js';
import { Skeleton } from '../types/skeleton.js';
import { NumberToken } from './number-tokens.js';

export function parseNumberAsSkeleton(
  tokens: NumberToken[],
  onError: (error: NumberFormatError) => void
) {
  const res: Skeleton = {};

  let hasGroups = false;
  let hasExponent = false;
  let intOptional = 0;
  let intDigits = '';
  let decimalPos = -1;
  let fracDigits = '';
  let fracOptional = 0;
  for (let pos = 0; pos < tokens.length; ++pos) {
    const token = tokens[pos];
    switch (token.char) {
      case '#': {
        if (decimalPos === -1) {
          if (intDigits) {
            const msg = 'Pattern has # after integer digits';
            onError(new PatternError('#', msg));
          }
          intOptional += token.width;
        } else {
          fracOptional += token.width;
        }
        break;
      }

      case '0': {
        if (decimalPos === -1) {
          intDigits += token.digits;
        } else {
          if (fracOptional) {
            const msg = 'Pattern has digits after # in fraction';
            onError(new PatternError('0', msg));
          }
          fracDigits += token.digits;
        }
        break;
      }

      case '@': {
        if (res.precision)
          onError(new MaskedValueError('precision', res.precision));
        res.precision = {
          style: 'precision-fraction',
          minSignificant: token.min,
          maxSignificant: token.width
        };
        break;
      }

      case ',':
        hasGroups = true;
        break;

      case '.':
        if (decimalPos === 1) {
          const msg = 'Pattern has more than one decimal separator';
          onError(new PatternError('.', msg));
        }
        decimalPos = pos;
        break;

      case 'E': {
        if (hasExponent)
          onError(new MaskedValueError('exponent', res.notation));
        if (hasGroups) {
          const msg =
            'Exponential patterns may not contain grouping separators';
          onError(new PatternError('E', msg));
        }
        res.notation = { style: 'scientific' };
        if (token.expDigits > 1) res.notation.expDigits = token.expDigits;
        if (token.plus) res.notation.expSign = 'sign-always';
        hasExponent = true;
      }
    }
  }

  // imprecise mapping due to paradigm differences
  if (hasGroups) res.group = 'group-auto';
  else if (intOptional + intDigits.length > 3) res.group = 'group-off';

  const increment = Number(`${intDigits || '0'}.${fracDigits}`);
  if (increment) res.precision = { style: 'precision-increment', increment };

  if (!hasExponent) {
    if (intDigits.length > 1) res.integerWidth = { min: intDigits.length };
    if (!res.precision && (fracDigits.length || fracOptional)) {
      res.precision = {
        style: 'precision-fraction',
        minFraction: fracDigits.length,
        maxFraction: fracDigits.length + fracOptional
      };
    }
  } else {
    if (!res.precision || increment) {
      res.integerWidth = intOptional
        ? { min: 1, max: intOptional + intDigits.length }
        : { min: Math.max(1, intDigits.length) };
    }
    if (res.precision) {
      if (!increment) res.integerWidth = { min: 1, max: 1 };
    } else {
      const dc = intDigits.length + fracDigits.length;
      if (decimalPos === -1) {
        if (dc > 0)
          res.precision = { style: 'precision-fraction', maxSignificant: dc };
      } else {
        res.precision = {
          style: 'precision-fraction',
          maxSignificant: Math.max(1, dc) + fracOptional
        };
        if (dc > 1) res.precision.minSignificant = dc;
      }
    }
  }

  return res;
}
