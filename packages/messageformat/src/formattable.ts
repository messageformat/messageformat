import { MessageFormatPart } from './formatted-part';

export class Formattable<T = unknown> {
  toParts: (source: string) => MessageFormatPart[];
  toString: () => string;
  toValue: () => T;

  constructor({
    toParts,
    toString,
    toValue
  }: {
    toParts?: (source: string) => MessageFormatPart[];
    toString?: () => string;
    toValue: () => T;
  }) {
    this.toParts =
      toParts || (source => [{ type: 'dynamic', value: toValue(), source }]);
    this.toString = toString || (() => String(toValue()));
    this.toValue = toValue;
  }
}
