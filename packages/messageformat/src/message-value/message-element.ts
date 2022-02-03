import type { Meta } from '../data-model';
import type { MessageFormatPart } from '../formatted-part';
import type { LocaleContext } from './locale-context';
import { FALLBACK_SOURCE, MessageValue } from './message-value';

export class MessageElement extends MessageValue<string> {
  static readonly type = 'element';

  tag: 'empty' | 'start' | 'end';
  declare options?: Record<string, unknown>;

  constructor(
    locale: string | string[] | LocaleContext | null,
    elem: string,
    {
      tag,
      meta,
      options,
      source
    }: {
      tag: 'empty' | 'start' | 'end';
      meta?: Meta;
      options?: Record<string, unknown>;
      source?: string;
    }
  ) {
    super(MessageElement.type, locale, elem, { meta, source });
    this.tag = tag;
    if (options) this.options = { ...options };
  }

  matchSelectKey() {
    return false;
  }

  toParts(): MessageFormatPart[] {
    const value = this.toString();
    const source = this.source || FALLBACK_SOURCE;
    return [{ type: 'fallback', value, source }];
  }

  toString() {
    // TODO: include options with valid XML name keys
    switch (this.tag) {
      case 'empty':
        return `<${this.value}/>`;
      case 'end':
        return `</${this.value}>`;
      default:
        return `<${this.value}>`;
    }
  }
}
