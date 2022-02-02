import type { Meta } from '../data-model';
import type { MessageFormatPart } from '../formatted-part';
import { extendLocaleContext, LocaleContext } from './locale-context';
import { FALLBACK_SOURCE, MessageValue } from './message-value';

export class MessageNumber extends MessageValue<number | bigint> {
  options: (Intl.NumberFormatOptions & Intl.PluralRulesOptions) | undefined;

  constructor(
    locale: string | string[] | LocaleContext | null,
    number: number | bigint | MessageNumber,
    {
      meta,
      options,
      source
    }: {
      meta?: Meta;
      options?: Intl.NumberFormatOptions & Intl.PluralRulesOptions;
      source?: string;
    } = {}
  ) {
    const fmt = { meta, source };
    if (number instanceof MessageNumber) {
      const lc = extendLocaleContext(number.localeContext, locale);
      super(lc, number.value, fmt);
      if (options || number.options)
        this.options = number.options
          ? { ...number.options, ...options }
          : { ...options };
    } else {
      super(locale, number, fmt);
      if (options) this.options = { ...options };
    }
  }

  private getIntl(Class: typeof Intl.NumberFormat): Intl.NumberFormat;
  private getIntl(Class: typeof Intl.PluralRules): Intl.PluralRules;
  private getIntl(Class: typeof Intl.NumberFormat | typeof Intl.PluralRules) {
    const lc = this.localeContext;
    const lm = lc?.localeMatcher;
    const opt = lm ? { localeMatcher: lm, ...this.options } : this.options;
    return new Class(lc?.locales, opt);
  }

  getPluralCategory() {
    if (!this.localeContext) return 'other';
    const pr = this.getIntl(Intl.PluralRules);
    // Intl.PluralRules really does need a number
    const num = Number(this.getValue());
    return pr.select(num);
  }

  /** Uses value directly due to plural offset weirdness */
  matchSelectKey(key: string) {
    return (
      (/^[0-9]+$/.test(key) && key === String(this.value)) ||
      key === this.getPluralCategory()
    );
  }

  toParts(): MessageFormatPart[] {
    try {
      const res = this.initFormattedParts(true);
      const nf = this.getIntl(Intl.NumberFormat);
      const num = this.getValue();
      for (const part of nf.formatToParts(num) as MessageFormatPart[]) {
        part.source = this.source;
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
    let num: number | bigint | undefined;
    try {
      num = this.getValue();
      const nf = this.getIntl(Intl.NumberFormat);
      return nf.format(num);
    } catch (_) {
      // TODO: Report error
      const source = this.source || FALLBACK_SOURCE;
      return num === undefined ? `{${source}}` : String(num);
    }
  }
}
