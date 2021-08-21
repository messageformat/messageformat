import type { Message, Meta } from './data-model';
import type { Context } from './format-context';
import type { MessageFormatPart } from './formatted-part';
import type { FormattedSelectMeta } from './select/detect-grammar';
import { resolvePattern } from './select/resolve';

export function formatToParts(ctx: Context, msg: Message): MessageFormatPart[] {
  let fsm: FormattedSelectMeta | null = null;
  const pattern = resolvePattern(ctx, msg, _fsm => (fsm = _fsm));
  const res: MessageFormatPart[] = [];
  if (msg.meta || fsm) {
    const meta: Meta = Object.assign({}, msg.meta, fsm);
    res.push({ type: 'message', value: '', meta });
  }
  for (const part of pattern)
    Array.prototype.push.apply(res, ctx.formatAsParts(part));
  return res;
}

export function formatToString(ctx: Context, msg: Message): string {
  let res = '';
  for (const part of resolvePattern(ctx, msg)) res += ctx.formatAsString(part);
  return res;
}
