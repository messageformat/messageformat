import { Formattable } from './formattable';
import { FormattableDateTime } from './formattable-datetime';
import { FormattableNumber } from './formattable-number';

export function asFormattable(value: unknown): Formattable {
  if (value instanceof Formattable) return value;
  if (typeof value === 'number' || typeof value === 'bigint')
    return new FormattableNumber(value);
  if (value instanceof Date) return new FormattableDateTime(value);
  return new Formattable(value);
}
