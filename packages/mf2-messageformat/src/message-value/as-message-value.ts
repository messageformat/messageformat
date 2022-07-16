import type { Context } from '../format-context';
import { MessageDateTime } from './message-datetime';
import { MessageNumber } from './message-number';
import { MessageValue, Meta } from './message-value';

/**
 * Convert any numerical value into a {@link MessageNumber}.
 *
 * @beta
 */
export function asMessageValue(
  ctx: Context,
  value: number | bigint,
  format?: { meta?: Readonly<Meta>; source?: string }
): MessageNumber;
/**
 * Convert any Date value into a {@link MessageDateTime}.
 *
 * @beta
 */
export function asMessageValue(
  ctx: Context,
  value: Date,
  format?: { meta?: Readonly<Meta>; source?: string }
): MessageDateTime;
/**
 * Convert any value into a {@link MessageValue} or one of its child classes.
 *
 * @beta
 */
export function asMessageValue(
  ctx: Context,
  value: unknown,
  format?: { meta?: Readonly<Meta>; source?: string }
): MessageValue;
export function asMessageValue(
  ctx: Context,
  value: unknown,
  format?: { meta?: Readonly<Meta>; source?: string }
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
