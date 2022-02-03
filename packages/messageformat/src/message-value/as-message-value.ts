import type { Meta } from '../data-model';
import type { Context } from '../format-context';
import { MessageDateTime } from './message-datetime';
import { MessageNumber } from './message-number';
import { MessageValue } from './message-value';

export function asMessageValue(
  ctx: Context,
  value: number | bigint,
  format?: { meta?: Meta; source?: string }
): MessageNumber;
export function asMessageValue(
  ctx: Context,
  value: Date,
  format?: { meta?: Meta; source?: string }
): MessageDateTime;
export function asMessageValue(
  ctx: Context,
  value: unknown,
  format?: { meta?: Meta; source?: string }
): MessageValue;
export function asMessageValue(
  ctx: Context,
  value: unknown,
  format?: { meta?: Meta; source?: string }
): MessageValue {
  if (value instanceof MessageValue) {
    if (format?.meta) value.meta = { ...value.meta, ...format.meta };
    if (format?.source) value.source = format.source;
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint')
    return new MessageNumber(ctx, value, format);

  if (value instanceof Date) return new MessageDateTime(ctx, value, format);

  return new MessageValue(MessageValue.type, ctx, value, format);
}
