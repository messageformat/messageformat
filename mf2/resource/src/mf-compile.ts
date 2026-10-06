/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MessageFormat,
  type MessageFormatOptions,
  type Model
} from 'messageformat';
import type { MessageResource, Messages } from './mf-parser.ts';

/**
 * Compile a parsed tree of Message data models
 * into a tree of MessageFormat instances.
 *
 * @param resource - The tree of Message values
 * @param options - The options used for each MessageFormat isntance.
 */
export function compileMessageResource(
  resource: MessageResource<Model.Message>,
  options?: MessageFormatOptions
): MessageResource<MessageFormat> {
  const res: MessageResource<any> = structuredClone(resource);
  compileMessages(res.locale, options, res.messages);
  return res;
}

function compileMessages(
  locale: string,
  options: MessageFormatOptions | undefined,
  messages: Messages<any>
) {
  for (const msg of Object.values(messages)) {
    if (msg.value) msg.value = new MessageFormat(locale, msg.value, options);
    if (msg.messages) compileMessages(locale, options, msg.messages);
  }
}
