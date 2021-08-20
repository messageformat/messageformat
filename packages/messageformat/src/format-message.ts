import { Message } from './data-model';
import type { Context } from './format-context';
import { addMeta, FormattedMessage, FormattedPart } from './formatted-part';
import type { FormattedSelectMeta } from './select/detect-grammar';
import { resolvePattern } from './select/resolve';

export function formatToParts(ctx: Context, msg: Message): FormattedPart[] {
  let fsm: FormattedSelectMeta | null = null;
  const pattern = resolvePattern(ctx, msg, _fsm => (fsm = _fsm));
  const res = pattern.map(part => ctx.formatAsPart(part));
  if (msg.meta || fsm) {
    const fm = new FormattedMessage(ctx.locales, res, msg.meta);
    if (fsm) addMeta(fm, fsm);
    return [fm];
  } else return res;
}

export function formatToString(ctx: Context, msg: Message): string {
  let res = '';
  for (const part of resolvePattern(ctx, msg)) res += ctx.formatAsString(part);
  return res;
}
