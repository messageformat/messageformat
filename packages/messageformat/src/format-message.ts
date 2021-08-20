import {
  isSelectMessage,
  Message,
  PatternElement,
  SelectMessage,
  Selector
} from './data-model';
import { FormattedSelectMeta, getFormattedSelectMeta } from './detect-grammar';
import type { Context } from './format-context';
import { addMeta, FormattedMessage, FormattedPart } from './formatted-part';

export function formatToParts(ctx: Context, msg: Message): FormattedPart[] {
  let fsm: FormattedSelectMeta | null = null;
  const pattern = isSelectMessage(msg)
    ? resolveSelect(ctx, msg, _fsm => (fsm = _fsm))
    : msg.value;
  const res = pattern.map(part => ctx.formatPart(part));
  if (msg.meta || fsm) {
    const fm = new FormattedMessage(ctx.locales, res, msg.meta);
    if (fsm) addMeta(fm, fsm);
    return [fm];
  } else return res;
}

function resolveSelect(
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
