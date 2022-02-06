import type { Meta } from '../data-model';
import { MessageValue } from './message-value';

export class MessageLiteral extends MessageValue<string> {
  static readonly type = 'literal';

  constructor(literal: string, fmt: { meta?: Readonly<Meta> }) {
    super(MessageLiteral.type, null, literal, fmt);
  }

  toString() {
    return this.value;
  }
}
