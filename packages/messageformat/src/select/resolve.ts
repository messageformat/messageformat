import {
  isSelectMessage,
  Message,
  PatternElement,
  Selector
} from '../data-model';
import type { Context } from '../format-context';
import { plural } from '../runtime/default';
import { FormattedSelectMeta, getFormattedSelectMeta } from './detect-grammar';

export function resolvePattern(
  ctx: Context,
  msg: Message,
  onMeta?: (meta: FormattedSelectMeta) => void
): PatternElement[] {
  if (!isSelectMessage(msg)) return msg.value;

  const res = msg.select.map(s => ({
    value: resolveSelectorValue(ctx, s),
    default: s.default || 'other'
  }));

  for (const { key, value } of msg.cases) {
    if (
      key.every((k, i) => {
        const r = res[i];
        return k === r.default || r.value.includes(k);
      })
    ) {
      if (onMeta) {
        const meta = getFormattedSelectMeta(msg, res, key);
        if (meta) onMeta(meta);
      }
      return value;
    }
  }

  return [];
}

function resolveSelectorValue(ctx: Context, { value }: Selector): string[] {
  let res = ctx.formatToValue(value);
  if (res === undefined) return [ctx.formatToString(value)];

  if (typeof res === 'number') {
    try {
      res = plural.call(ctx.locales, undefined, res);
    } catch (_) {
      // TODO: report error
    }
  }

  return Array.isArray(res) && res.every(r => typeof r === 'string')
    ? res
    : [String(res)];
}
