import { MessageFormatPart } from './formatted-part';

export class Formattable<T = unknown, O = Record<string, unknown>> {
  static from(value: unknown): Formattable | FormattableNumber {
    if (value instanceof Formattable) return value;
    else if (typeof value === 'number' || value instanceof BigInt)
      return new FormattableNumber(value);
    else return new Formattable(value);
  }

  valueOf: () => T;

  constructor(
    value: T,
    format?: {
      toParts?: Formattable<T, O>['toParts'];
      toString?: Formattable<T, O>['toString'];
    }
  ) {
    this.valueOf = () => value;
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
    const value = this.valueOf();
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
    const value = this.valueOf();
    if (locales)
      try {
        if (value instanceof Date) {
          const dtf = new Intl.DateTimeFormat(locales, options);
          return dtf.format(value);
        }
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
      super(number.valueOf());
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

  getNumberFormatter(
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
    const number = this.valueOf() as number;
    const parts: MessageFormatPart[] = nf.formatToParts(number);
    for (const part of parts) part.source = source;
    return parts;
  }

  toString(locales?: string[], options?: Intl.NumberFormatOptions | undefined) {
    const nf = this.getNumberFormatter(locales, options);
    const number = this.valueOf() as number;
    return nf.format(number);
  }
}
