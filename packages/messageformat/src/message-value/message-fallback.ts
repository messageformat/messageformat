import type { Meta } from '../data-model';
import { MessageFormatPart } from '../formatted-part';
import type { LocaleContext } from './locale-context';
import { MessageValue } from './message-value';

interface MessageFallbackOptions {
  fallbackParts?: () => Array<
    MessageFormatPart | { type: 'fallback'; value: string }
  >;
  fallbackString?: () => string;
  source: string;
}

export class MessageFallback extends MessageValue<undefined> {
  #fallbackParts?: () => Array<
    MessageFormatPart | { type: 'fallback'; value: string }
  >;
  #fallbackString?: () => string;
  #fallbackValue: () => string;

  constructor(
    locale: string | string[] | LocaleContext | null,
    meta: Meta | undefined,
    { fallbackParts, fallbackString, source }: MessageFallbackOptions
  ) {
    super(locale, undefined, { meta, source });
    this.#fallbackParts = fallbackParts;
    this.#fallbackString = fallbackString;
    this.#fallbackValue = () =>
      this.#fallbackString ? this.#fallbackString() : this.getSource(true);
  }

  matchSelectKey() {
    return false;
  }

  toParts() {
    const res = this.initFormattedParts(true);
    const source = this.getSource(true);
    if (this.#fallbackParts)
      for (const part of this.#fallbackParts()) res.push({ ...part, source });
    else {
      const value = this.#fallbackValue();
      res.push({ type: 'fallback', value, source });
    }
    return res;
  }

  toString() {
    const str = this.#fallbackValue();
    return `{${str}}`;
  }
}
