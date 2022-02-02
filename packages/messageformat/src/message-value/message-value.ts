import type { Meta } from '../data-model';
import type { MessageFormatPart } from '../formatted-part';
import { LocaleContext } from './locale-context';

export class MessageValue<T = unknown> {
  protected readonly value: T;
  #localeContext: string | string[] | LocaleContext | null;
  #meta?: Meta;
  #source?: string;
  #type?: 'dynamic' | 'literal';

  constructor(
    locale: string | string[] | LocaleContext | null,
    value: T,
    format?: {
      meta?: Meta;
      source?: string;
      toString?: MessageValue<T>['toString'];
      type?: 'dynamic' | 'literal';
    }
  ) {
    this.value = value;
    this.#localeContext = locale;
    if (format) {
      const { meta, source, toString, type } = format;
      if (meta) this.#meta = meta;
      if (source) this.#source = source;
      if (toString && Object.prototype.hasOwnProperty.call(format, 'toString'))
        this.toString = toString;
      if (type) this.#type = type;
    }
  }

  get localeContext(): LocaleContext | null {
    const lc = this.#localeContext;
    if (!lc) return null;

    let localeMatcher: 'best fit' | 'lookup' | undefined;
    let locales: string[];
    if (typeof lc === 'string') locales = [lc];
    else if (Array.isArray(lc)) locales = lc.slice();
    else {
      locales = lc.locales.slice();
      localeMatcher = lc.localeMatcher;
    }
    return { locales, localeMatcher };
  }

  set localeContext(locale: string | string[] | LocaleContext | null) {
    this.#localeContext = locale;
  }

  getSource(fallback: boolean) {
    return this.#source ?? (fallback ? '???' : '');
  }

  setSource(source: string) {
    this.#source = source;
  }

  getFormattedType() {
    return this.#type ?? 'dynamic';
  }

  getValue() {
    return this.value;
  }

  initFormattedParts(fallback: boolean, meta?: Meta): MessageFormatPart[] {
    if (!meta && !this.#meta) return [];

    const mp: MessageFormatPart = {
      type: 'meta',
      value: '',
      meta: { ...this.#meta, ...meta }
    };
    const source = this.getSource(fallback);
    if (source) mp.source = source;
    return [mp];
  }

  setMeta(meta: Meta) {
    this.#meta = this.#meta ? { ...this.#meta, ...meta } : meta;
  }

  matchSelectKey(key: string) {
    const value = this.getValue();
    return value != null && String(value) === key;
  }

  toParts(): MessageFormatPart[] {
    try {
      const res = this.initFormattedParts(false);
      const type = this.getFormattedType();
      const source = this.getSource(false);

      if (type === 'literal') {
        const part: MessageFormatPart = { type, value: this.toString() };
        if (source) part.source = source;
        res.push(part);
        return res;
      }

      // Limit value to string | symbol | function | object
      let value: unknown = this.getValue();
      // HERE
      //console.log({ value });
      switch (typeof value) {
        case 'string':
        case 'symbol':
        case 'function':
          break;
        case 'object':
          value = value?.valueOf();
          if (value && typeof value === 'object') break;
        // fallthrough
        default:
          value = this.toString();
      }

      res.push({ type, value, source });
      return res;
    } catch (_) {
      // TODO: Report error
      const value = this.toString();
      const source = this.getSource(true);
      return [{ type: 'fallback', value, source }];
    }
  }

  toString(): string {
    let value: { toLocaleString: (...args: unknown[]) => string } | undefined;
    try {
      value = this.getValue();
      const lc = this.localeContext;
      if (lc && value && typeof value.toLocaleString === 'function') {
        const lm = lc.localeMatcher;
        const opt = lm ? { localeMatcher: lm } : undefined;
        return value.toLocaleString(lc.locales, opt);
      }
    } catch (_) {
      // TODO: Report error
      if (value === undefined) value = '{' + this.getSource(true) + '}';
    }
    return String(value);
  }
}
