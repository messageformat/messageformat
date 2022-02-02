import type { Meta } from '../data-model';
import type { MessageFormatPart } from '../formatted-part';
import type { LocaleContext } from './locale-context';
import { FALLBACK_SOURCE, MessageValue } from './message-value';

export class MessageElement extends MessageValue<string> {
  tag: 'empty' | 'start' | 'end';
  options?: Record<string, unknown>;

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
    super(locale, elem, { meta, source });
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
    const name = this.getValue();
    switch (this.tag) {
      case 'empty':
        return `<${name}/>`;
      case 'end':
        return `</${name}>`;
      default:
        return `<${name}>`;
    }
  }
}
