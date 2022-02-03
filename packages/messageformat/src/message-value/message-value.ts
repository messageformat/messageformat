import type { Meta } from '../data-model';
import { LocaleContext } from './locale-context';

export const FALLBACK_SOURCE = '???';

export class MessageValue<T = unknown> {
  static readonly type: string = 'value';

  readonly type: string;
  value: T;
  declare source?: string;
  declare meta?: Meta;

  #localeContext: string | string[] | LocaleContext | null;

  constructor(
    type: string,
    locale: string | string[] | LocaleContext | null,
    value: T,
    format?: {
      meta?: Meta;
      source?: string;
      toString?: MessageValue<T>['toString'];
    }
  ) {
    this.type = type;
    this.value = value;
    this.#localeContext = locale;
    if (format) {
      const { meta, source, toString } = format;
      if (source) this.source = source;
      if (meta) this.meta = { ...meta };
      if (toString && Object.prototype.hasOwnProperty.call(format, 'toString'))
        this.toString = toString;
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

  matchSelectKey(key: string) {
    return this.value != null && String(this.value) === key;
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
