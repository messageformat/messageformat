import type { LocaleContextArg } from './locale-context';
import { FALLBACK_SOURCE, MessageValue, Meta } from './message-value';

/**
 * A child class of {@link MessageValue} for fallback values.
 *
 * Used to represent parse errors as well as runtime/formatting errors.
 *
 * @beta
 */
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
