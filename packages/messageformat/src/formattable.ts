import { MessageFormatPart } from './formatted-part';

export class Formattable<T = unknown, O = Record<string, unknown>> {
  static from(value: unknown): Formattable {
    if (value instanceof Formattable) return value;
    if (typeof value === 'number' || typeof value === 'bigint')
      return new FormattableNumber(value);
    if (value instanceof Date) return new FormattableDateTime(value);
    return new Formattable(value);
  }

  readonly value: T;

  constructor(
    value: T,
    format?: {
      toParts?: Formattable<T, O>['toParts'];
      toString?: Formattable<T, O>['toString'];
    }
  ) {
    this.value = value;
    if (format) {
      if (format.toParts) this.toParts = format.toParts;
      if (format.toString) this.toString = format.toString;
    }
  }

  getValue() {
    return this.value;
  }

  match(_locales: string[], key: string) {
    return String(this.value) === key;
  }

  toParts(
    locales: string[],
    options: O | undefined,
    source: string
  ): MessageFormatPart[] {
    const value = this.getValue();
    let res: MessageFormatPart[];
    if (value instanceof Date) {
      const dtf = new Intl.DateTimeFormat(locales, options);
      res = dtf.formatToParts(value);
    } else if (
      value == null ||
      typeof value === 'boolean' ||
      value instanceof Boolean ||
      value instanceof String
    ) {
      return [{ type: 'dynamic', value: String(value), source }];
    } else {
      // At this point, value is symbol | function | object
      return [{ type: 'dynamic', value, source }];
    }
    for (const fmt of res) fmt.source = source;
    return res;
  }

  toString(locales?: string[], options?: O | undefined): string {
    const value: {
      toLocaleString: (...args: unknown[]) => string;
    } = this.getValue();
    if (locales && value && typeof value.toLocaleString === 'function')
      try {
        return value.toLocaleString(locales, options);
      } catch (_) {
        // TODO: Report error?
      }
    return String(value);
  }
}

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
    options?: Intl.NumberFormatOptions | undefined
  ): Intl.NumberFormat {
    if (this.options)
      options = options ? { ...this.options, ...options } : this.options;
    return new Intl.NumberFormat(this.locales || locales, options);
  }

  getPluralCategory(locales: string[]) {
    const pr = new Intl.PluralRules(
      this.locales || locales,
      this.options as Intl.PluralRulesOptions | undefined
    );
    // Intl.PluralRules really does need a number
    const num = Number(this.getValue());
    return pr.select(num);
  }

  /** Uses value directly due to plural offset weirdness */
  match(locales: string[], key: string) {
    return (
      (/^[0-9]+$/.test(key) && key === String(this.value)) ||
      key === this.getPluralCategory(locales)
    );
  }

  toParts(
    locales: string[],
    options: Intl.NumberFormatOptions | undefined,
    source: string
  ) {
    const nf = this.getNumberFormatter(locales, options);
    const number = this.getValue() as number; // FIXME: TS should know that bigint is fine here
    const parts: MessageFormatPart[] = nf.formatToParts(number);
    for (const part of parts) part.source = source;
    return parts;
  }

  toString(locales?: string[], options?: Intl.NumberFormatOptions | undefined) {
    const nf = this.getNumberFormatter(locales, options);
    return nf.format(this.getValue());
  }
}

export class FormattableDateTime extends Formattable<
  Date,
  Intl.DateTimeFormatOptions
> {
  locales: string[] | undefined;
  options: Intl.DateTimeFormatOptions | undefined;

  constructor(
    date: Date | FormattableDateTime,
    options?: Intl.DateTimeFormatOptions | undefined
  );
  constructor(
    date: Date | FormattableDateTime,
    locales: string | string[] | null,
    options?: Intl.DateTimeFormatOptions | undefined
  );
  constructor(
    date: Date | FormattableDateTime,
    arg?: string | string[] | Intl.DateTimeFormatOptions | null,
    options?: Intl.DateTimeFormatOptions
  ) {
    let lc: string[] | undefined;
    if (typeof arg === 'string') lc = [arg];
    else if (Array.isArray(arg)) lc = arg.slice();
    else {
      lc = undefined;
      options = arg ?? undefined;
    }

    if (date instanceof FormattableDateTime) {
      super(date.value);
      this.locales = date.locales || lc;
      this.options = date.options ? { ...date.options, ...options } : options;
    } else {
      super(date);
      this.locales = lc;
      this.options = options;
    }
  }

  private getDateTimeFormatter(
    locales?: string | string[] | undefined,
    options?: Intl.DateTimeFormatOptions | undefined
  ): Intl.DateTimeFormat {
    if (this.options)
      options = options ? { ...this.options, ...options } : this.options;
    return new Intl.DateTimeFormat(this.locales || locales, options);
  }

  toParts(
    locales: string[],
    options: Intl.DateTimeFormatOptions | undefined,
    source: string
  ) {
    const dtf = this.getDateTimeFormatter(locales, options);
    const parts: MessageFormatPart[] = dtf.formatToParts(this.getValue());
    for (const part of parts) part.source = source;
    return parts;
  }

  toString(
    locales?: string[],
    options?: Intl.DateTimeFormatOptions | undefined
  ) {
    const hasOpt =
      (options && Object.keys(options).some(key => key !== 'localeMatcher')) ||
      (this.options &&
        Object.keys(this.options).some(key => key !== 'localeMatcher'));
    const date = this.getValue();
    if (hasOpt) {
      const dtf = this.getDateTimeFormatter(locales, options);
      return dtf.format(date);
    } else return date.toLocaleString(this.locales || locales);
  }
}
