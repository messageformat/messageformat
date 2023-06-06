import type { LocaleContextArg } from './locale-context';
import { MessageValue, Meta } from './message-value';

const MARKUP_START = 'markup-start';
const MARKUP_END = 'markup-end';

/**
 * A child class of {@link MessageValue} for starting markup elements.
 *
 * @beta
 */
export class MessageMarkup extends MessageValue<string> {
  options: Record<string, unknown>;
  operand?: MessageValue;

  constructor(
    locale: LocaleContextArg,
    name: string,
    {
      kind,
      meta,
      operand,
      options,
      source
    }: {
      kind: 'open' | 'close';
      meta?: Readonly<Meta>;
      operand?: MessageValue;
      options?: Readonly<Record<string, unknown>>;
      source?: string;
    }
  ) {
    const type = kind === 'open' ? MARKUP_START : MARKUP_END;
    super(type, locale, name, { meta, source });
    this.options = { ...options };
    if (operand) this.operand = operand;
  }

  selectKey() {
    return null;
  }

  toString() {
    const sigil = this.type === MARKUP_START ? '+' : '-';
    return `{${sigil}${this.value}}`;
  }
}
