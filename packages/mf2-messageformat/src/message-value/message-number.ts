import type { Meta } from '../data-model';
import { Context } from '../format-context';
import { extendLocaleContext, LocaleContextArg } from './locale-context';
import { FALLBACK_SOURCE, MessageValue } from './message-value';

export class MessageNumber extends MessageValue<number | bigint> {
  static readonly type = 'number';

  declare options?: Intl.NumberFormatOptions & Intl.PluralRulesOptions;

  constructor(
    locale: LocaleContextArg,
    number: number | bigint | Readonly<MessageNumber>,
    {
      meta,
      options,
      source
    }: {
      meta?: Readonly<Meta>;
      options?: Readonly<Intl.NumberFormatOptions & Intl.PluralRulesOptions>;
      source?: string;
    } = {}
  ) {
    const fmt = { meta, source };
    if (number instanceof MessageNumber) {
      const lc = extendLocaleContext(number.localeContext, locale);
      super(MessageNumber.type, lc, number.value, fmt);
      if (options || number.options)
        this.options = number.options
          ? { ...number.options, ...options }
          : { ...options };
    } else if (typeof number === 'number' || typeof number === 'bigint') {
      super(MessageNumber.type, locale, number, fmt);
      if (options) this.options = { ...options };
    } else throw TypeError(`Invalid ${typeof number} as number argument`);
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
    const num = Number(this.value);
    return pr.select(num);
  }

  /** Uses value directly due to plural offset weirdness */
  matchSelectKey(key: string) {
    return (
      (/^[0-9]+$/.test(key) && key === String(this.value)) ||
      key === this.getPluralCategory()
    );
  }

  toParts(): Intl.NumberFormatPart[] {
    const nf = this.getIntl(Intl.NumberFormat);
    return nf.formatToParts(this.value);
  }

  toString(onError?: Context['onError']) {
    try {
      const nf = this.getIntl(Intl.NumberFormat);
      return nf.format(this.value);
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
