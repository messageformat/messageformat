import {
  MessageFormat,
  type MessageFormatOptions,
  MessageSyntaxError
} from 'messageformat';
import type { CST } from './cst-parser.ts';
import type { MessageResource, Messages } from './mf-parser.ts';
import { MessageResourceParseError, getOrCreateSection } from './mf-parser.ts';

/**
 * Compile a `CST.Resource` value into a tree of MessageFormat instances.
 *
 * @param cst - The previously parsed CST resource
 * @param options - The options used for each MessageFormat isntance.
 */
export function buildMessageResourceFromCST(
  cst: CST.Resource,
  options?: MessageFormatOptions
): MessageResource {
  let locale = '';
  let inBody = false;
  let pos = 0;
  const messages: Messages = Object.create(null);
  let section = messages;
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
        if (!locale) {
          const msg = 'No locale metadata in resource frontmatter';
          throw new MessageResourceParseError(pos, msg);
        }
        inBody = true;
        break;
      case 'metadata':
        if (!inBody && line.key.value === 'locale') locale = line.value.value;
        break;
      case 'section-head':
        if (!inBody) break loop;
        section = getOrCreateSection(messages, line.id.value);
        break;
      case 'entry':
        if (!inBody) {
          break loop;
        } else {
          const path = [...line.id.value];
          const last = path.pop()!;
          const parent = getOrCreateSection(section, path);
          const self = (parent[last] ??= {});
          if ('value' in self) {
            throw new MessageResourceParseError(pos, 'Message already defined');
          }
          try {
            self.value = new MessageFormat(locale, line.value.value, options);
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
  return { locale, messages };
}
