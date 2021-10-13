import { Message, Meta, PatternElement } from '../data-model';
import { getFormattedSelectMeta } from '../extra/detect-grammar';
import type { Context } from '../format-context';
import type { MessageFormatPart } from '../formatted-part';
import { Formattable } from './formattable';

export class FormattableMessage extends Formattable<Message, Context> {
  #context: Context;
  #meta: Meta | null = null;
  #pattern: PatternElement[] | null = null;
  #string: string | null = null;

  constructor(context: Context, message: Message) {
    super(message);
    this.#context = context;
    if (message.meta) this.#meta = { ...message.meta };
  }

  private getPattern() {
    if (this.#pattern) return this.#pattern;
    const msg = this.getValue();
    if (msg.type === 'message') return (this.#pattern = msg.value);

    const ctx = this.#context;
    const sel = msg.select.map(({ value, fallback }) => ({
      fmt: ctx.getFormatter(value).asFormattable(ctx, value),
      def: fallback || 'other'
    }));

    cases: for (const { key, value } of msg.cases) {
      const fallback = new Array<boolean>(key.length);
      for (let i = 0; i < key.length; ++i) {
        const k = key[i];
        const s = sel[i];
        if (typeof k !== 'string' || !s) continue cases;
        if (s.fmt.matchSelectKey(k, ctx.locales, ctx.localeMatcher))
          fallback[i] = false;
        else if (s.def === k) fallback[i] = true;
        else continue cases;
      }

      const meta = getFormattedSelectMeta(ctx, msg, key, sel, fallback);
      if (meta) {
        if (this.#meta) Object.assign(this.#meta, meta);
        else this.#meta = meta;
      }
      if (this.#meta) this.#meta['selectResult'] = 'success';
      return (this.#pattern = value);
    }

    if (!this.#meta) this.#meta = {};
    this.#meta['selectResult'] = 'no-match';
    return (this.#pattern = []);
  }

  matchSelectKey(key: string) {
    return this.toString() === key;
  }

  toParts(source?: string) {
    const pattern = this.getPattern();
    const res: MessageFormatPart[] = [];
    if (this.#meta)
      res.push({ type: 'meta', value: '', meta: { ...this.#meta } });
    const ctx = this.#context;
    for (const elem of pattern) {
      const parts = ctx.getFormatter(elem).formatToParts(ctx, elem);
      Array.prototype.push.apply(res, parts);
    }
    if (source)
      for (const part of res)
        part.source = part.source ? source + '/' + part.source : source;
    return res;
  }

  toString() {
    if (typeof this.#string !== 'string') {
      this.#string = '';
      const ctx = this.#context;
      for (const elem of this.getPattern())
        this.#string += ctx.getFormatter(elem).formatToString(ctx, elem);
    }
    return this.#string;
  }
}
