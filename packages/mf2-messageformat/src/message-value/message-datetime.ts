import type { Meta } from '../data-model';
import { Context } from '../format-context';
import { extendLocaleContext, LocaleContextArg } from './locale-context';
import { FALLBACK_SOURCE, MessageValue } from './message-value';

export class MessageDateTime extends MessageValue<Date> {
  static readonly type = 'datetime';

  declare options?: Intl.DateTimeFormatOptions;

  constructor(
    locale: LocaleContextArg,
    date: number | Date | Readonly<MessageDateTime>,
    {
      meta,
      options,
      source
    }: {
      meta?: Readonly<Meta>;
      options?: Readonly<Intl.DateTimeFormatOptions>;
      source?: string;
    } = {}
  ) {
    const fmt = { meta, source };
    if (date instanceof MessageDateTime) {
      const lc = extendLocaleContext(date.localeContext, locale);
      super(MessageDateTime.type, lc, date.value, fmt);
      if (options || date.options)
        this.options = date.options
          ? { ...date.options, ...options }
          : { ...options };
    } else {
      if (typeof date === 'number') date = new Date(date);
      if (date instanceof Date) {
        super(MessageDateTime.type, locale, date, fmt);
        if (options) this.options = { ...options };
      } else throw new TypeError(`Invalid ${typeof date} as date argument`);
    }
  }

  private getDateTimeFormatter() {
    const lc = this.localeContext;
    const opt = lc
      ? { localeMatcher: lc.localeMatcher, ...this.options }
      : this.options;
    return new Intl.DateTimeFormat(lc?.locales, opt);
  }

  toParts(): Intl.DateTimeFormatPart[] {
    const dtf = this.getDateTimeFormatter();
    return dtf.formatToParts(this.value);
  }

  toString(onError?: Context['onError']) {
    try {
      const hasOpt = this.options && Object.keys(this.options).length > 0;
      if (hasOpt) {
        const dtf = this.getDateTimeFormatter();
        return dtf.format(this.value);
      } else {
        const lc = this.localeContext;
        return lc
          ? this.value.toLocaleString(lc.locales, lc)
          : String(this.value);
      }
    } catch (error) {
      if (onError) onError(error, this);
      if (this.value === undefined) {
        const source = this.source || FALLBACK_SOURCE;
        return `{${source}}`;
      }
      return String(this.value);
    }
  }
}
