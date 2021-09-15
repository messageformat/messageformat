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
