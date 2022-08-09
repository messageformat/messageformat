import { Context } from '../format-context';
import type { LocaleContextArg } from './locale-context';
import { MessageValue, Meta } from './message-value';

const MARKUP_START = 'markup-start';
const MARKUP_END = 'markup-end';

/**
 * A child class of {@link MessageValue} for starting markup elements.
 *
 * @beta
 */
export class MessageMarkupStart extends MessageValue<string> {
  options: Record<string, unknown>;

  constructor(
    locale: LocaleContextArg,
    name: string,
    {
      meta,
      options,
      source
    }: {
      meta?: Readonly<Meta>;
      options?: Readonly<Record<string, unknown>>;
      source?: string;
    }
  ) {
    super(MARKUP_START, locale, name, { meta, source });
    this.options = { ...options };
  }

  matchSelectKey() {
    return false;
  }

  toString(onError?: Context['onError']) {
    let tag = this.value;
    for (const [key, opt] of Object.entries(this.options)) {
      try {
        if (/^\w[\w-]*$/.test(key)) {
          let strOpt = String(opt);
          if (/[^\w-]/.test(strOpt)) {
            strOpt = '(' + strOpt.replace(/[()\\]/g, '\\$&') + ')';
          }
          tag += ` ${key}=${strOpt}`;
        }
      } catch (error) {
        if (onError) onError(error, this);
      }
    }
    return `{+${tag}}`;
  }
}

/**
 * A child class of {@link MessageValue} for ending markup elements.
 *
 * @beta
 */
export class MessageMarkupEnd extends MessageValue<string> {
  constructor(
    locale: LocaleContextArg,
    name: string,
    options: { meta?: Readonly<Meta>; source?: string }
  ) {
    super(MARKUP_END, locale, name, options);
  }

  matchSelectKey() {
    return false;
  }

  toString() {
    return `{-${this.value}}`;
  }
}
