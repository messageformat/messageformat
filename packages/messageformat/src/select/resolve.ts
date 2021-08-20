import type { PatternElement, SelectMessage, Selector } from '../data-model';
import type { Context } from '../format-context';
import { FormattedSelectMeta, getFormattedSelectMeta } from './detect-grammar';

export function resolveSelect(
  ctx: Context,
  select: SelectMessage,
  onMeta?: (meta: FormattedSelectMeta) => void
): PatternElement[] {
  const res = select.select.map(s => ({
    value: resolveSelectorValue(ctx, s),
    default: s.default || 'other'
  }));

  for (const { key, value } of select.cases) {
    if (
      key.every((k, i) => {
        const r = res[i];
        return k === r.default || r.value.includes(k);
      })
    ) {
      if (onMeta) {
        const meta = getFormattedSelectMeta(select, res, key);
        if (meta) onMeta(meta);
      }
      return value;
    }
  }
  return [];
}

function resolveSelectorValue(ctx: Context, { value }: Selector): string[] {
  let res = ctx.formatPart(value).valueOf();
  if (typeof res === 'number') {
    try {
      res = ctx.runtime.plural.call(ctx.locales, undefined, res);
    } catch (_) {
      // TODO: report error
    }
  }

  return Array.isArray(res) && res.every(r => typeof r === 'string')
    ? res
    : [String(res)];
}
