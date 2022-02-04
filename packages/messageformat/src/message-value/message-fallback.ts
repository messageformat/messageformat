import type { Meta } from '../data-model';
import type { LocaleContextArg } from './locale-context';
import { FALLBACK_SOURCE, MessageValue } from './message-value';

export class MessageFallback extends MessageValue<undefined> {
  static readonly type = 'fallback';

  constructor(
    locale: LocaleContextArg,
    fmt: { meta?: Readonly<Meta>; source: string }
  ) {
    super(MessageFallback.type, locale, undefined, fmt);
  }

  matchSelectKey() {
    return false;
  }

  toString() {
    const source = this.source || FALLBACK_SOURCE;
    return `{${source}}`;
  }
}
