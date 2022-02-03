import type { Meta } from '../data-model';
import type { LocaleContext } from './locale-context';
import { FALLBACK_SOURCE, MessageValue } from './message-value';

export class MessageFallback extends MessageValue<undefined> {
  static readonly type = 'fallback';

  #fallbackValue: () => string;

  constructor(
    locale: string | string[] | LocaleContext | null,
    meta: Meta | undefined,
    {
      fallbackString,
      source
    }: {
      fallbackString?: () => string;
      source: string;
    }
  ) {
    super(MessageFallback.type, locale, undefined, { meta, source });
    this.#fallbackValue =
      fallbackString ?? (() => this.source || FALLBACK_SOURCE);
  }

  matchSelectKey() {
    return false;
  }

  toString() {
    const str = this.#fallbackValue();
    return `{${str}}`;
  }
}
