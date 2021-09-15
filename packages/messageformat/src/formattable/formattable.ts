import type { MessageFormatPart } from '../formatted-part';

export class Formattable<T = unknown, O = Record<string, unknown>> {
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

  matchSelectKey(_locales: string[], key: string) {
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
