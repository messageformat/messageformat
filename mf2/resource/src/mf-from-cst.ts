import { MessageSyntaxError, parseMessage } from 'messageformat';
import type { CST } from './cst-parser.ts';
import {
  MessageResource,
  MessageResourceParseError,
  MessageWrapper,
  getOrCreateSection
} from './mf-parser.ts';

/**
 * Compile a `CST.Resource` value into a tree of `Message` values.
 *
 * @param cst - The previously parsed CST resource
 */
export function buildMessageResourceFromCST(
  cst: CST.Resource
): MessageResource {
  let inBody = false;
  let pos = 0;
  const resource = new MessageResource('');
  let section: Map<string, MessageWrapper> = resource;

  loop: for (const line of cst) {
    pos = line.range[0];
    switch (line.type) {
      case 'empty-line':
      case 'comment':
        break;
      case 'frontmatter':
        if (inBody) {
          const msg = 'Identifier must not start with ---';
          throw new MessageResourceParseError(pos, msg);
        }
        if (!resource.locale) {
          const msg = 'No locale metadata in resource frontmatter';
          throw new MessageResourceParseError(pos, msg);
        }
        inBody = true;
        break;
      case 'metadata':
        if (!inBody && line.key.value === 'locale') {
          resource.locale = line.value.value;
        }
        break;
      case 'section-head':
        if (!inBody) break loop;
        section = getOrCreateSection(resource, line.id.value);
        break;
      case 'entry':
        if (!inBody) {
          break loop;
        } else {
          const path = [...line.id.value];
          const last = path.pop()!;
          const parent = getOrCreateSection(section, path);
          let self = parent.get(last);
          if (!self) {
            self = new MessageWrapper();
            parent.set(last, self);
          }
          if (self.value) {
            throw new MessageResourceParseError(pos, 'Message already defined');
          }
          try {
            self.value = parseMessage(line.value.value);
          } catch (error) {
            let parseError;
            if (error instanceof MessageSyntaxError) {
              parseError = new MessageResourceParseError(
                pos + error.start,
                `Message syntax error: ${error.message}`
              );
            } else {
              parseError = new MessageResourceParseError(pos, String(error));
            }
            parseError.cause = error;
            throw parseError;
          }
        }
    }
  }
  if (!inBody) {
    const msg = 'Missing resource frontmatter';
    throw new MessageResourceParseError(pos, msg);
  }
  return resource;
}
