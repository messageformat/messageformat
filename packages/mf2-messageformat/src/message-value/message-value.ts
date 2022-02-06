import type { Meta } from '../data-model';
import { Context } from '../format-context';
import {
  isLocaleContext,
  LocaleContext,
  LocaleContextArg
} from './locale-context';

export const FALLBACK_SOURCE = '???';

export class MessageValue<T = unknown> {
  static readonly type: string = 'value';

  readonly type: string;
  value: T;
  declare source?: string;
  declare meta?: Meta;

  #localeContext: LocaleContextArg;

  constructor(
    type: string,
    locale: LocaleContextArg,
    value: T,
    format?: {
      meta?: Readonly<Meta>;
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
    let localeMatcher: 'best fit' | 'lookup' | undefined;
    let locales: string[] | undefined;
    const lc = this.#localeContext;
    if (lc && typeof lc === 'string') locales = [lc];
    else if (Array.isArray(lc)) locales = lc.slice();
    else if (isLocaleContext(lc)) {
      locales = lc.locales.slice();
      localeMatcher = lc.localeMatcher;
    }
    return locales ? { locales, localeMatcher } : null;
  }

  set localeContext(locale: string | string[] | LocaleContext | null) {
    this.#localeContext = locale;
  }

  matchSelectKey(key: string) {
    return this.value != null && String(this.value) === key;
  }

  toString(onError?: Context['onError']): string {
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
    } catch (error) {
      if (onError) onError(error, this);
      if (value === undefined) {
        const source = this.source || FALLBACK_SOURCE;
        return `{${source}}`;
      }
    }
    return String(value);
  }
}
