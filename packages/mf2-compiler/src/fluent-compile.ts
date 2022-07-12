import { parse } from '@fluent/syntax';
import { Message, MessageFormat, MessageFormatOptions } from 'messageformat';
import { astToMessage } from './fluent-ast-to-message';
import { getFluentRuntime } from './fluent-runtime';

export function compileFluentResource(
  source: string | Map<string, Message>,
  locales?: string | string[],
  options?: MessageFormatOptions
): Map<string, MessageFormat> {
  const res: Map<string, MessageFormat> = new Map();

  const runtime = Object.assign(getFluentRuntime(res), options?.runtime);
  const opt = { ...options, runtime };

  const data =
    typeof source === 'string'
      ? compileFluentResourceData(source).data
      : source;
  for (const [id, msg] of data)
    res.set(id, new MessageFormat(msg, locales, opt));

  return res;
}

export function compileFluentResourceData(src: string): {
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
          const entry = astToMessage(msg.value, msg.comment);
          if (groupComment) {
            entry.comment = entry.comment
              ? `${groupComment}\n\n${entry.comment}`
              : groupComment;
          }
          data.set(id, entry);
        }
        for (const attr of msg.attributes)
          data.set(`${id}.${attr.id.name}`, astToMessage(attr.value, null));
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
