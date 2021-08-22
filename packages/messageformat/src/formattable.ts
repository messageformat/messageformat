import { MessageFormatPart } from './formatted-part';

export class Formattable<T = unknown, O = Record<string, unknown>> {
  static from(value: unknown): Formattable {
    if (value instanceof Formattable) return value;
    if (typeof value === 'number' || value instanceof BigInt)
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

  toParts(
    locales: string[],
    options: O | undefined,
    source: string
  ): MessageFormatPart[] {
    const value = this.value;
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
    } = this.value;
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
  number | BigInt,
  Intl.NumberFormatOptions
> {
  locales: string[] | undefined;
  options: Intl.NumberFormatOptions | undefined;

  constructor(
    number: number | BigInt | FormattableNumber,
    options?: Intl.NumberFormatOptions | undefined
  );
  constructor(
    number: number | BigInt | FormattableNumber,
    locales: string | string[] | null,
    options?: Intl.NumberFormatOptions | undefined
  );
  constructor(
    number: number | BigInt | FormattableNumber,
    arg?: string | string[] | Intl.NumberFormatOptions | null,
    options?: Intl.NumberFormatOptions
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

  toParts(
    locales: string[],
    options: Intl.NumberFormatOptions | undefined,
    source: string
  ) {
    const nf = this.getNumberFormatter(locales, options);
    const number = this.value as number;
    const parts: MessageFormatPart[] = nf.formatToParts(number);
    for (const part of parts) part.source = source;
    return parts;
  }

  toString(locales?: string[], options?: Intl.NumberFormatOptions | undefined) {
    const nf = this.getNumberFormatter(locales, options);
    const number = this.value as number;
    return nf.format(number);
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
    const parts: MessageFormatPart[] = dtf.formatToParts(this.value);
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
    if (hasOpt) {
      const dtf = this.getDateTimeFormatter(locales, options);
      return dtf.format(this.value);
    } else return this.value.toLocaleString(this.locales || locales);
  }
}
