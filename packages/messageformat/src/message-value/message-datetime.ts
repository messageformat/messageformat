import type { Meta } from '../data-model';
import type { MessageFormatPart } from '../formatted-part';
import { extendLocaleContext, LocaleContext } from './locale-context';
import { FALLBACK_SOURCE, MessageValue } from './message-value';

export class MessageDateTime extends MessageValue<Date> {
  static readonly type = 'datetime';

  declare options?: Intl.DateTimeFormatOptions;

  constructor(
    locale: string | string[] | LocaleContext | null,
    date: Date | MessageDateTime,
    {
      meta,
      options,
      source
    }: {
      meta?: Meta;
      options?: Intl.DateTimeFormatOptions;
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
      super(MessageDateTime.type, locale, date, fmt);
      if (options) this.options = { ...options };
    }
  }

  private getDateTimeFormatter() {
    const lc = this.localeContext;
    const opt = lc
      ? { localeMatcher: lc.localeMatcher, ...this.options }
      : this.options;
    return new Intl.DateTimeFormat(lc?.locales, opt);
  }

  toParts(): MessageFormatPart[] {
    try {
      const res = this.initFormattedParts(true);
      const dtf = this.getDateTimeFormatter();
      const source = this.source;
      for (const part of dtf.formatToParts(this.value) as MessageFormatPart[]) {
        part.source = source;
        res.push(part);
      }
      return res;
    } catch (_) {
      // TODO: Report error
      const value = this.toString();
      const source = this.source || FALLBACK_SOURCE;
      return [{ type: 'fallback', value, source }];
    }
  }

  toString() {
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
    } catch (_) {
      // TODO: Report error
      if (this.value === undefined) {
        const source = this.source || FALLBACK_SOURCE;
        return `{${source}}`;
      }
      return String(this.value);
    }
  }
}
