import { parse } from '@fluent/syntax';
import { MessageGroup } from 'messageformat';
import { astToMessage, Part } from './fluent-ast-to-message';

export function compileFluent(src: string): MessageGroup<Part> {
  const ast = parse(src, { withSpans: false });
  const entries: MessageGroup<Part>['entries'] = {};
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
            // TODO: Should this be in comment rather than meta?
            if (entry.meta) entry.meta.group = groupComment;
            else entry.meta = { group: groupComment };
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
  const res: MessageGroup<Part> = { type: 'group', entries };
  if (resourceComments.length > 0) res.comment = resourceComments.join('\n\n');
  return res;
}
