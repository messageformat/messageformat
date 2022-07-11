import { parse } from '@fluent/syntax';
import { MessageGroup } from 'messageformat';
import { astToMessage } from './fluent-ast-to-message';

export function compileFluent(src: string): MessageGroup {
  const ast = parse(src, { withSpans: false });
  const entries: MessageGroup['entries'] = {};
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
          entries[id] = entry;
        }
        for (const attr of msg.attributes)
          entries[`${id}.${attr.id.name}`] = astToMessage(attr.value, null);
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
  const res: MessageGroup = { type: 'group', entries };
  if (resourceComments.length > 0) res.comment = resourceComments.join('\n\n');
  return res;
}
