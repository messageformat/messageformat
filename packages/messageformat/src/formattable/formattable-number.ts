import { MessageFormatPart } from '../formatted-part';
import { Formattable } from './formattable';

export class FormattableNumber extends Formattable<
  number | bigint,
  Intl.NumberFormatOptions & Intl.PluralRulesOptions
> {
  locales: string[] | undefined;
  options: (Intl.NumberFormatOptions & Intl.PluralRulesOptions) | undefined;

  constructor(
    number: number | bigint | FormattableNumber,
    options?: (Intl.NumberFormatOptions & Intl.PluralRulesOptions) | undefined
  );
  constructor(
    number: number | bigint | FormattableNumber,
    locales: string | string[] | null,
    options?: (Intl.NumberFormatOptions & Intl.PluralRulesOptions) | undefined
  );
  constructor(
    number: number | bigint | FormattableNumber,
    arg?:
      | string
      | string[]
      | (Intl.NumberFormatOptions & Intl.PluralRulesOptions)
      | null,
    options?: Intl.NumberFormatOptions & Intl.PluralRulesOptions
  ) {
    let lc: string[] | undefined;
    if (typeof arg === 'string') lc = [arg];
    else if (Array.isArray(arg)) lc = arg.slice();
    else {
      lc = undefined;
      options = arg ?? undefined;
    }

    if (number instanceof FormattableNumber) {
      super(number.value);
      this.locales = number.locales || lc;
      this.options = number.options
        ? { ...number.options, ...options }
        : options;
    } else {
      super(number);
      this.locales = lc;
      this.options = options;
    }
  }

  private getNumberFormatter(
    locales?: string | string[] | undefined,
    localeMatcher?: 'best fit' | 'lookup'
  ): Intl.NumberFormat {
    const options = { localeMatcher, ...this.options };
    return new Intl.NumberFormat(this.locales || locales, options);
  }

  getPluralCategory(locales: string[], localeMatcher: 'best fit' | 'lookup') {
    const options = { localeMatcher, ...this.options };
    const pr = new Intl.PluralRules(this.locales || locales, options);
    // Intl.PluralRules really does need a number
    const num = Number(this.getValue());
    return pr.select(num);
  }

  /** Uses value directly due to plural offset weirdness */
  matchSelectKey(
    key: string,
    locales: string[],
    localeMatcher: 'best fit' | 'lookup'
  ) {
    return (
      (/^[0-9]+$/.test(key) && key === String(this.value)) ||
      key === this.getPluralCategory(locales, localeMatcher)
    );
  }

  toParts(
    source: string,
    locales: string[],
    localeMatcher: 'best fit' | 'lookup'
  ) {
    const nf = this.getNumberFormatter(locales, localeMatcher);
    const number = this.getValue() as number; // FIXME: TS should know that bigint is fine here
    const parts: MessageFormatPart[] = nf.formatToParts(number);
    for (const part of parts) part.source = source;
    return parts;
  }

  toString(locales?: string[], localeMatcher?: 'best fit' | 'lookup') {
    const nf = this.getNumberFormatter(locales, localeMatcher);
    return nf.format(this.getValue());
  }
}
