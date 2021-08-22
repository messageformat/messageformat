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

export class FormattableNumber extends Formattable<number | BigInt> {
  constructor(
    number: number | BigInt,
    locales?: string | string[],
    options?: Intl.NumberFormatOptions
  ) {
    let nf: Intl.NumberFormat | null = null;
    const getNF = () => {
      if (!nf) nf = new Intl.NumberFormat(locales, options);
      return nf;
    };
    super({
      toParts(source) {
        const parts: MessageFormatPart[] = getNF().formatToParts(
          number as number
        );
        for (const part of parts) part.source = source;
        return parts;
      },
      toString: () => getNF().format(number as number),
      toValue: () => number
    });
  }
}
