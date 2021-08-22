import { MessageFormatPart } from './formatted-part';

export class Formattable<T = unknown> {
  valueOf: () => T;

  constructor(
    value: T,
    format?: {
      toParts?: (source: string) => MessageFormatPart[];
      toString?: () => string;
    }
  ) {
    this.valueOf = () => value;
    if (format) {
      if (format.toParts) this.toParts = format.toParts;
      if (format.toString) this.toString = format.toString;
    }
  }

  toParts(source: string): MessageFormatPart[] {
    return [{ type: 'dynamic', value: this.valueOf(), source }];
  }

  toString(): string {
    return String(this.valueOf());
  }
}

export class FormattableNumber extends Formattable<number | BigInt> {
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

  toParts(source: string) {
    const nf = this.getNumberFormatter();
    const number = this.valueOf() as number;
    const parts: MessageFormatPart[] = nf.formatToParts(number);
    for (const part of parts) part.source = source;
    return parts;
  }

  toString() {
    const nf = this.getNumberFormatter();
    const number = this.valueOf() as number;
    return nf.format(number);
  }
}
