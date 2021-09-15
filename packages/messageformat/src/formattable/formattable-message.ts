import { isSelectMessage, Message, Meta, PatternElement } from '../data-model';
import type { Context } from '../format-context';
import type { MessageFormatPart } from '../formatted-part';
import { getFormattedSelectMeta } from '../select/detect-grammar';
import { Formattable } from './formattable';

export class FormattableMessage extends Formattable<Message, Context> {
  context: Context;

  #meta: Meta | null = null;
  #pattern: PatternElement[] | null = null;
  #string: string | null = null;

  constructor(context: Context, message: Message) {
    super(message);
    this.context = context;
    if (message.meta) this.#meta = { ...message.meta };
  }

  private getPattern() {
    if (!this.#pattern) {
      this.#pattern = resolvePattern(this.context, this.getValue(), fsm => {
        if (this.#meta) Object.assign(this.#meta, fsm);
        else this.#meta = fsm;
      });
    }
    return this.#pattern;
  }

  matchSelectKey(_locales: unknown, key: string) {
    return this.toString() === key;
  }

  toParts(_locales?: unknown, _options?: unknown, source?: string) {
    const pattern = this.getPattern();
    const res: MessageFormatPart[] = [];
    if (this.#meta)
      res.push({ type: 'message', value: '', meta: { ...this.#meta } });
    for (const part of pattern)
      Array.prototype.push.apply(res, this.context.formatToParts(part));
    if (source)
      for (const part of res)
        part.source = part.source ? source + '/' + part.source : source;
    return res;
  }

  toString() {
    if (typeof this.#string !== 'string') {
      this.#string = '';
      for (const part of this.getPattern())
        this.#string += this.context.formatToString(part);
    }
    return this.#string;
  }
}

function resolvePattern(
  ctx: Context,
  msg: Message,
  onMeta: (meta: Meta) => void
) {
  if (!isSelectMessage(msg)) return msg.value;

  const sel = msg.select.map(s => ({
    fmt: ctx.asFormattable(s.value),
    def: s.fallback || 'other'
  }));

  cases: for (const { key, value } of msg.cases) {
    const fallback = new Array<boolean>(key.length);
    for (let i = 0; i < key.length; ++i) {
      const k = key[i];
      const s = sel[i];
      if (typeof k !== 'string' || !s) continue cases;
      if (s.fmt.matchSelectKey(ctx.locales, k)) fallback[i] = false;
      else if (s.def === k) fallback[i] = true;
      else continue cases;
    }

    const meta = getFormattedSelectMeta(ctx.locales, msg, key, sel, fallback);
    if (meta) onMeta(meta);

    return value;
  }

  return [];
}
