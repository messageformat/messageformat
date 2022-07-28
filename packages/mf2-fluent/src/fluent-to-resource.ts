import { parse } from '@fluent/syntax';
import { Message, MessageFormat, MessageFormatOptions } from 'messageformat';
import { fluentToMessage } from './fluent-to-message';
import { getFluentRuntime } from './runtime';

/**
 * Compile a Fluent resource (i.e. an FTL file) into a Map of
 * {@link messageformat#MessageFormat} instances.
 *
 * A runtime provided by {@link getFluentRuntime} is automatically used in these instances.
 *
 * @beta
 * @param source - A Fluent resource, either as the string contents of an FTL file,
 *   or in the shape output by {@link fluentToResourceData}.
 * @param locales - The locale code or codes to use for all of the resource's messages.
 * @param options - The MessageFormat constructor options to use for all of the resource's messages.
 */
export function fluentToResource(
  source: string | Map<string, Message>,
  locales?: string | string[],
  options?: MessageFormatOptions
): Map<string, MessageFormat> {
  const res: Map<string, MessageFormat> = new Map();

  const runtime = Object.assign(getFluentRuntime(res), options?.runtime);
  const opt = { ...options, runtime };

  const data =
    typeof source === 'string' ? fluentToResourceData(source).data : source;
  for (const [id, msg] of data)
    res.set(id, new MessageFormat(msg, locales, opt));

  return res;
}

/**
 * Compile a Fluent resource (i.e. an FTL file) into a Map of
 * {@link messageformat#Message} data objects.
 *
 * @beta
 * @param src - A Fluent resource, as the string contents of an FTL file.
 * @returns An object containing the messages as `data` and any resource-level
 *   `comments` of the resource.
 */
export function fluentToResourceData(src: string): {
  data: Map<string, Message>;
  comments: string;
} {
  const ast = parse(src, { withSpans: false });
  const data = new Map<string, Message>();
  let groupComment = '';
  const resourceComments: string[] = [];
  for (const msg of ast.body) {
    switch (msg.type) {
      case 'Message':
      case 'Term': {
        const id = msg.type === 'Term' ? `-${msg.id.name}` : msg.id.name;
        if (msg.value) {
          const entry = fluentToMessage(msg.value, msg.comment);
          if (groupComment) {
            entry.comment = entry.comment
              ? `${groupComment}\n\n${entry.comment}`
              : groupComment;
          }
          data.set(id, entry);
        }
        for (const attr of msg.attributes)
          data.set(`${id}.${attr.id.name}`, fluentToMessage(attr.value, null));
        break;
      }
      case 'GroupComment':
        groupComment = msg.content;
        break;
      case 'ResourceComment':
        resourceComments.push(msg.content);
        break;
    }
  }

  return { data, comments: resourceComments.join('\n\n') };
}
