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

  matchSelectKey(
    _locales: string[],
    _localeMatcher: 'best fit' | 'lookup',
    key: string
  ) {
    return String(this.value) === key;
  }

  toParts(
    locales: string[],
    localeMatcher: 'best fit' | 'lookup',
    source: string
  ): MessageFormatPart[] {
    const value = this.getValue();
    let res: MessageFormatPart[];
    if (value instanceof Date) {
      const dtf = new Intl.DateTimeFormat(locales, { localeMatcher });
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

  toString(): string;
  toString(locales: string[], localeMatcher: 'best fit' | 'lookup'): string;
  toString(locales?: string[], localeMatcher?: 'best fit' | 'lookup'): string {
    const value: {
      toLocaleString: (...args: unknown[]) => string;
    } = this.getValue();
    if (locales && value && typeof value.toLocaleString === 'function')
      try {
        return value.toLocaleString(locales, { localeMatcher });
      } catch (_) {
        // TODO: Report error?
      }
    return String(value);
  }
}
