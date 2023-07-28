import {
  Message,
  MessageFormat,
  MessageFormatOptions,
  parseMessage
} from 'messageformat';
import { parseCST } from './cst-parser';

const errPos = (start: number, end: number) => `[start:${start}, end:${end}]`;

/**
 * Parse a resource from its serialised form into a flat map of `Message` objects
 * identified by their `string[]` paths.
 */
export function parseResource(
  source: string,
  onError: (error: Error) => void
): Map<string[], Message> {
  const cst = parseCST(source, (range, msg) => {
    const pos = errPos(range[0], range[1]);
    onError(new Error(`Resource parse error ${pos}: ${msg}`));
  });
  let section: string[] = [];
  const res = new Map<string[], Message>();
  for (const entry of cst) {
    switch (entry.type) {
      case 'section-head':
        section = entry.id.value;
        break;
      case 'entry': {
        const msg = parseMessage(entry.value.value, { resource: true });
        for (const { message, start, end } of msg.errors) {
          const msgStart = entry.value.range[0];
          const pos = errPos(msgStart + start, msgStart + end);
          onError(new Error(`Message parse error ${pos}: ${message}`));
        }
        res.set(section.concat(entry.id.value), msg);
        break;
      }
    }
  }
  return res;
}

export type MessageMap = Map<string, MessageFormat | MessageMap>;

/**
 * Given a parsed resource,
 * build a hierarchical `MessageMap` structure with
 * `MessageFormat` instances for each message.
 */
export function compileResource(
  res: Map<string[], Message>,
  locales: string | string[],
  options?: MessageFormatOptions
): MessageMap {
  const map: MessageMap = new Map();
  for (const [path, msg] of res) {
    let parent = map;
    for (let i = 0; i < path.length - 1; ++i) {
      const key = path[i] ?? '';
      const curr = parent.get(key);
      if (curr instanceof Map) {
        parent = curr;
      } else if (curr instanceof MessageFormat) {
        const id = path.slice(0, i + 1).join('.');
        throw new Error(`Message cannot have child messages: ${id}`);
      } else {
        const next: MessageMap = new Map();
        parent.set(key, next);
        parent = next;
      }
    }
    const key = path.at(-1) ?? '';
    if (parent.has(key)) {
      const id = path.join('.');
      const msg =
        parent.get(key) instanceof MessageFormat
          ? 'Message defined twice'
          : 'Message cannot have child messages';
      throw new Error(`${msg}: ${id}`);
    }
    const mf = new MessageFormat(msg, locales, options);
    parent.set(key, mf);
  }
  return map;
}
