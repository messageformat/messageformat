import type { Meta } from '../data-model';
import type { MessageFormatPart } from '../formatted-part';
import { MessageValue, LocaleContext } from './message-value';

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
      super(number.getLocaleContext(locale), number.value, fmt);
      if (options || number.options)
        this.options = number.options
          ? { ...number.options, ...options }
          : { ...options };
    } else {
      super(locale, number, fmt);
      if (options) this.options = { ...options };
    }
  }

  private getNumberFormatter() {
    const lc = this.getLocaleContext();
    const lm = lc?.localeMatcher;
    const opt = lm ? { localeMatcher: lm, ...this.options } : this.options;
    return new Intl.NumberFormat(lc?.locales, opt);
  }

  getPluralCategory() {
    const lc = this.getLocaleContext();
    if (!lc || !lc.locales[0]) return 'other';

    const lm = lc.localeMatcher;
    const opt = lm ? { localeMatcher: lm, ...this.options } : this.options;
    const pr = new Intl.PluralRules(lc.locales, opt);

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
      const nf = this.getNumberFormatter();
      const num = this.getValue();
      const source = this.getSource(false);
      for (const part of nf.formatToParts(num) as MessageFormatPart[]) {
        part.source = source;
        res.push(part);
      }
      return res;
    } catch (_) {
      // TODO: Report error
      const value = this.toString();
      const source = this.getSource(true);
      return [{ type: 'fallback', value, source }];
    }
  }

  toString() {
    let num: number | bigint | undefined;
    try {
      num = this.getValue();
      const nf = this.getNumberFormatter();
      return nf.format(num);
    } catch (_) {
      // TODO: Report error
      return num === undefined ? '{' + this.getSource(true) + '}' : String(num);
    }
  }
}
