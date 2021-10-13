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
    if (format) Object.assign(this, format);
  }

  getValue() {
    return this.value;
  }

  matchSelectKey(
    _locales: string[],
    _localeMatcher: 'best fit' | 'lookup',
    key: string
  ) {
    return String(this.getValue()) === key;
  }

  toParts(
    _locales: string[],
    _localeMatcher: 'best fit' | 'lookup',
    source: string
  ): MessageFormatPart[] {
    let value: unknown = this.getValue();
    if (value == null || typeof value === 'boolean' || value instanceof Boolean)
      value = String(value);
    // At this point, value is string | symbol | function | object
    return [{ type: 'dynamic', value, source }];
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
