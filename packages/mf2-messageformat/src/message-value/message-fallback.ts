import type { LocaleContextArg } from './locale-context';
import { FALLBACK_SOURCE, MessageValue, Meta } from './message-value';

const FALLBACK = 'fallback';

/**
 * A child class of {@link MessageValue} for fallback values.
 *
 * @remarks
 * Used to represent parse errors as well as runtime/formatting errors.
 *
 * @beta
 */
export class MessageFallback extends MessageValue<undefined> {
  constructor(
    locale: LocaleContextArg,
    fmt: { meta?: Readonly<Meta>; source: string }
  ) {
    super(FALLBACK, locale, undefined, fmt);
  }

  selectKey() {
    return null;
  }

  toString() {
    const source = this.source || FALLBACK_SOURCE;
    return `{${source}}`;
  }
}
