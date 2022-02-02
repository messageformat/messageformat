import type { Meta } from '../data-model';
import type { MessageFormatPart } from '../formatted-part';
import { LocaleContext } from './locale-context';

export const FALLBACK_SOURCE = '???';

export class MessageValue<T = unknown> {
  readonly value: T;
  declare source?: string;
  declare meta?: Meta;

  #localeContext: string | string[] | LocaleContext | null;
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
      if (source) this.source = source;
      if (meta) this.meta = { ...meta };
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

  getFormattedType() {
    return this.#type ?? 'dynamic';
  }

  initFormattedParts(fallback: boolean, meta?: Meta): MessageFormatPart[] {
    if (!meta && !this.meta) return [];

    const mp: MessageFormatPart = {
      type: 'meta',
      value: '',
      meta: { ...this.meta, ...meta }
    };
    if (this.source) mp.source = this.source;
    else if (fallback) mp.source = FALLBACK_SOURCE;
    return [mp];
  }

  matchSelectKey(key: string) {
    return this.value != null && String(this.value) === key;
  }

  toParts(): MessageFormatPart[] {
    try {
      const res = this.initFormattedParts(false);
      const type = this.getFormattedType();

      if (type === 'literal') {
        const part: MessageFormatPart = { type, value: this.toString() };
        if (this.source) part.source = this.source;
        res.push(part);
        return res;
      }

      // Limit value to string | symbol | function | object
      let value: unknown = this.value;
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

      // For non-literals, source should always be set
      const source = this.source || FALLBACK_SOURCE;
      res.push({ type, value, source });
      return res;
    } catch (_) {
      // TODO: Report error
      const value = this.toString();
      const source = this.source || FALLBACK_SOURCE;
      return [{ type: 'fallback', value, source }];
    }
  }

  toString(): string {
    const value:
      | { toLocaleString: (...args: unknown[]) => string }
      | undefined = this.value;
    try {
      const lc = this.localeContext;
      if (lc && value && typeof value.toLocaleString === 'function') {
        const lm = lc.localeMatcher;
        const opt = lm ? { localeMatcher: lm } : undefined;
        return value.toLocaleString(lc.locales, opt);
      }
    } catch (_) {
      // TODO: Report error
      if (value === undefined) {
        const source = this.source || FALLBACK_SOURCE;
        return `{${source}}`;
      }
    }
    return String(value);
  }
}
