import type { Meta } from '../data-model';
import type { Context } from '../format-context';
import { Formattable } from './formattable';
import { FormattableDateTime } from './formattable-datetime';
import { FormattableNumber } from './formattable-number';

export function asFormattable(
  ctx: Context,
  value: unknown,
  format?: { meta?: Meta; source?: string }
): Formattable {
  if (value instanceof Formattable) {
    if (format?.meta) value.setMeta(format.meta);
    if (format?.source) value.setSource(format.source);
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint')
    return new FormattableNumber(ctx, value, format);

  if (value instanceof Date) return new FormattableDateTime(ctx, value, format);

  return new Formattable(ctx, value, format);
}
