import { Context } from '../format-context';
import {
  isLocaleContext,
  LocaleContext,
  LocaleContextArg
} from './locale-context';

export const FALLBACK_SOURCE = '�';

/**
 * Additional meta information may be attached to most nodes. In common use,
 * this information is not required when formatting a message.
 *
 * @beta
 */
export type Meta = Record<string, string>;

/**
 * Type guard for message values that may contain a `meta` member
 *
 * @beta
 */
export const hasMeta = <T>(
  part: MessageValue<T>
): part is MessageValue<T> & { meta: Meta } =>
  !!part.meta &&
  typeof part.meta === 'object' &&
  Object.keys(part.meta).length > 0;

/**
 * The base class of all message values.
 *
 * @beta
 */
export class MessageValue<T = unknown> {
  readonly type: string;
  value: T;
  declare source?: string;
  declare meta?: Meta;

  #localeContext: LocaleContextArg;

  constructor(
    type: string | null,
    locale: LocaleContextArg,
    value: T,
    format?: {
      meta?: Readonly<Meta>;
      source?: string;
      toString?: MessageValue<T>['toString'];
    }
  ) {
    this.type = type ?? 'value';
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

  matchSelectKey(key: string): boolean | Meta {
    return this.value != null && String(this.value) === key;
  }

  toString(onError?: Context['onError']): string {
    const value = this.value as
      | { toLocaleString?: (...args: unknown[]) => string }
      | undefined;
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
