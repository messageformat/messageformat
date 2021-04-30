import { parse } from '@fluent/syntax';
import { Resource } from 'messageformat';
import { astToMessage } from './fluent-ast-to-message';

export function compileFluent(
  src: string,
  { id, locale }: { id: string; locale: string }
): Resource {
  const ast = parse(src, { withSpans: false });
  const entries: Resource['entries'] = {};
  for (const msg of ast.body) {
    if (msg.type === 'Message' || msg.type === 'Term') {
      const id = msg.type === 'Term' ? `-${msg.id.name}` : msg.id.name;
      if (msg.value) entries[id] = astToMessage(msg.value);
      for (const attr of msg.attributes)
        entries[`${id}.${attr.id.name}`] = astToMessage(attr.value);
    }
  }
  return { id, locale, entries };
}
