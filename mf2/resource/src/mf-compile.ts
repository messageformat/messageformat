import { MessageFormat, type MessageFormatOptions } from 'messageformat';
import type { MessageResource, MessageWrapper } from './mf-parser.ts';

/** Extends `Map`, adding a `.value` for the base message. */
export class MessageFormatWrapper extends Map<string, MessageFormatWrapper> {
  value?: MessageFormat;

  constructor(
    value?: MessageFormat,
    entries?: readonly (readonly [string, MessageFormatWrapper])[]
  ) {
    super(entries);
    if (value) this.value = value;
  }
}

/**
 * Compile a parsed tree of Message data models
 * into a tree of MessageFormat instances.
 *
 * If set, the `options` are used for each MessageFormat instance.
 * The locale is set by `resource.locale`.
 *
 * In the returned map, `MessageFormatWrapper` values extend `Map`,
 * adding a `.value?: MessageFormat` for each leaf node.
 * The structure of the map is the same as that of `resource`.
 *
 * @param resource - The tree of Message values
 * @param options - The options used for each MessageFormat instance.
 */
export function compileMessageResource(
  resource: MessageResource,
  options?: MessageFormatOptions
): Map<string, MessageFormatWrapper> {
  return new Map(compileMessages(resource.locale, options, resource));
}

function compileMessages(
  locale: string,
  options: MessageFormatOptions | undefined,
  messages: Map<string, MessageWrapper>
): [string, MessageFormatWrapper][] {
  return Array.from(messages, ([key, msg]) => {
    const mf = msg.value
      ? new MessageFormat(locale, msg.value, options)
      : undefined;
    const msgEntries = compileMessages(locale, options, msg);
    return [key, new MessageFormatWrapper(mf, msgEntries)];
  });
}
