import { isSelectMessage, Message } from './data-model';
import type { Context } from './format-context';
import { addMeta, FormattedMessage, FormattedPart } from './formatted-part';
import type { FormattedSelectMeta } from './select/detect-grammar';
import { resolveSelect } from './select/resolve';

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
