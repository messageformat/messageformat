import { Message, PatternElement } from '../data-model';
import { getFormattedSelectMeta } from '../extra/detect-grammar';
import type { Context } from '../format-context';
import { Formattable } from './formattable';

export class FormattableMessage extends Formattable<Message> {
  readonly #context: Context;
  #pattern: PatternElement[] | null = null;
  #string: string | null = null;

  constructor(context: Context, message: Message, source?: string) {
    super(context, message, { meta: message.meta, source });
    this.#context = context;
  }

  /** As a side effect, sets selection metadata */
  private getPattern() {
    if (this.#pattern) return this.#pattern;
    const msg = this.getValue();
    if (msg.type === 'message') return (this.#pattern = msg.pattern);

    const ctx = this.#context;
    const sel = msg.select.map(({ value, fallback }) => ({
      fmt: ctx.resolve(value),
      def: fallback || 'other'
    }));

    cases: for (const { key, value } of msg.cases) {
      const fallback = new Array<boolean>(key.length);
      for (let i = 0; i < key.length; ++i) {
        const k = key[i];
        const s = sel[i];
        if (typeof k !== 'string' || !s) continue cases;
        if (s.fmt.matchSelectKey(k)) fallback[i] = false;
        else if (s.def === k) fallback[i] = true;
        else continue cases;
      }

      const meta = getFormattedSelectMeta(msg, key, sel, fallback);
      if (meta) this.setMeta(meta);
      return (this.#pattern = value.pattern);
    }

    this.setMeta({ selectResult: 'no-match' });
    return (this.#pattern = []);
  }

  matchSelectKey(key: string) {
    return this.toString() === key;
  }

  toParts() {
    const pattern = this.getPattern();
    const res = this.initFormattedParts(false);
    const ctx = this.#context;
    const source = this.getSource(false);
    for (const elem of pattern) {
      const parts = ctx.resolve(elem).toParts();
      for (const part of parts) {
        if (source)
          part.source = part.source ? source + '/' + part.source : source;
        res.push(part);
      }
    }
    return res;
  }

  toString() {
    if (typeof this.#string !== 'string') {
      this.#string = '';
      for (const elem of this.getPattern()) {
        this.#string += this.#context.resolve(elem).toString();
      }
    }
    return this.#string;
  }
}
