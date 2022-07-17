import { MessageValue, Meta } from './message-value';

const LITERAL = 'literal';

/**
 * A child class of {@link MessageValue} for values defined directly in the message data.
 *
 * @beta
 */
export class MessageLiteral extends MessageValue<string> {
  constructor(literal: string, fmt?: { meta?: Readonly<Meta> }) {
    super(LITERAL, null, literal, fmt);
  }

  toString() {
    return this.value;
  }
}
