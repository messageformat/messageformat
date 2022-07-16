import { MessageValue, Meta } from './message-value';

/**
 * A child class of {@link MessageValue} for values defined directly in the message data.
 *
 * @beta
 */
export class MessageLiteral extends MessageValue<string> {
  static readonly type = 'literal';

  constructor(literal: string, fmt?: { meta?: Readonly<Meta> }) {
    super(MessageLiteral.type, null, literal, fmt);
  }

  toString() {
    return this.value;
  }
}
