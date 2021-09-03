import { isSelectMessage, Message, PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { Formattable } from '../formattable';
import { FormattedSelectMeta, getFormattedSelectMeta } from './detect-grammar';

export function resolvePattern(
  ctx: Context,
  msg: Message,
  onMeta?: (meta: FormattedSelectMeta) => void
): PatternElement[] {
  if (!isSelectMessage(msg)) return msg.value;

  const sel = msg.select.map(s => {
    const value = ctx.formatToValue(s.value, Formattable);
    return {
      fmt: Formattable.from(value),
      def: s.default || 'other'
    };
  });

  cases: for (const { key, value } of msg.cases) {
    const fallback = new Array<boolean>(key.length);
    for (let i = 0; i < key.length; ++i) {
      const k = key[i];
      const s = sel[i];
      if (typeof k !== 'string' || !s) continue cases;
      if (s.fmt.match(ctx.locales, k)) fallback[i] = false;
      else if (s.def === k) fallback[i] = true;
      else continue cases;
    }

    if (onMeta) {
      const meta = getFormattedSelectMeta(ctx.locales, msg, key, sel, fallback);
      if (meta) onMeta(meta);
    }

    return value;
  }

  return [];
}
