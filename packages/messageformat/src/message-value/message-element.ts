import type { Meta } from '../data-model';
import type { LocaleContext } from './locale-context';
import { MessageValue } from './message-value';

const elementTags = new WeakMap<MessageElement, 'start' | 'end'>();

export class MessageElement extends MessageValue<MessageValue[]> {
  static readonly type = 'element';

  name: string;
  declare options?: Record<string, unknown>;

  constructor(
    locale: string | string[] | LocaleContext | null,
    name: string,
    {
      tag,
      meta,
      options,
      source
    }: {
      tag?: 'empty' | 'start' | 'end';
      meta?: Meta;
      options?: Record<string, unknown>;
      source?: string;
    }
  ) {
    super(MessageElement.type, locale, [], { meta, source });
    this.name = name;
    if (options) this.options = { ...options };
    if (tag === 'start' || tag === 'end') elementTags.set(this, tag);
  }

  get isEndTag() {
    return elementTags.get(this) === 'end';
  }

  matchSelectKey() {
    return false;
  }

  toString() {
    const { name, options, value } = this;
    if (this.isEndTag) return `</${name}>`;

    let start = name;
    if (options) {
      for (const [key, opt] of Object.entries(options)) {
        if (/^\w[\w-]*$/.test(key))
          start += ` ${key}=${JSON.stringify(String(opt))}`;
      }
    }

    return value.length > 0
      ? `<${start}>${value.join('')}</${name}>`
      : `<${start}/>`;
  }
}

/**
 * Fill out MessageElement `value`s with their appropriate contents
 *
 * @param body Modified, assigning element contents & dropping end tags
 */
export function fillMessageElements(body: MessageValue[]) {
  const stack: MessageElement[] = [];
  for (let i = 0; i < body.length; ++i) {
    const mv = body[i];
    if (mv instanceof MessageElement) {
      switch (elementTags.get(mv)) {
        case 'start':
          stack.push(mv);
          break;
        case 'end': {
          const el = stack.pop();
          if (!el) break;
          const start = body.indexOf(el) + 1;
          el.value = body.splice(start, i - start);
          i = start - 1;
          elementTags.delete(el);
          if (mv.name === el.name) {
            // Remove matching end element
            body.splice(start, 1);
          } else {
            // Improper nesting of tags needs special handling
            //
            // Example: <b>bold <i>both</b> italic</i>
            //                         ^ here, with stack = [<b>, <i>]
            //   1. End current <i> element
            //   2. Insert copy of <i> after </b>
            //   3. Re-handle this </b>, now with stack = [<b>]
            //
            // Result: <b>bold <i>both</i></b><i> italic</i>
            body.splice(start + 1, 0, copyStartElement(el));
          }
          break;
        }
      }
    }
  }

  let el = stack.pop();
  while (el) {
    // End of body before matching end element
    el.value = body.splice(body.indexOf(el) + 1);
    elementTags.delete(el);
    el = stack.pop();
  }
}

function copyStartElement(el: MessageElement) {
  const { localeContext, name, meta, options, source } = el;
  const fmt = { tag: 'start' as const, meta, options, source };
  return new MessageElement(localeContext, name, fmt);
}
