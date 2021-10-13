import { MessageFormatPart } from '../formatted-part';
import { Formattable } from './formattable';

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
    localeMatcher?: 'best fit' | 'lookup'
  ): Intl.DateTimeFormat {
    const options = { localeMatcher, ...this.options };
    return new Intl.DateTimeFormat(this.locales || locales, options);
  }

  toParts(
    source: string,
    locales: string[],
    localeMatcher: 'best fit' | 'lookup'
  ) {
    const dtf = this.getDateTimeFormatter(locales, localeMatcher);
    const parts: MessageFormatPart[] = dtf.formatToParts(this.getValue());
    for (const part of parts) part.source = source;
    return parts;
  }

  toString(locales?: string[], localeMatcher?: 'best fit' | 'lookup') {
    const hasOpt =
      this.options &&
      Object.keys(this.options).some(key => key !== 'localeMatcher');
    const date = this.getValue();
    if (hasOpt) {
      const dtf = this.getDateTimeFormatter(locales, localeMatcher);
      return dtf.format(date);
    } else {
      const lm = this.options?.localeMatcher || localeMatcher;
      const options = lm ? { localeMatcher: lm } : undefined;
      return date.toLocaleString(this.locales || locales, options);
    }
  }
}
