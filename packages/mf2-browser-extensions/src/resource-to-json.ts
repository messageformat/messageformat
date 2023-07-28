import type { Message } from 'messageformat';
import type { JsonFile } from './types';
import { messageToExtensionJson } from './message-to-json';

/**
 * For each `source` message, identifies the matching `target` message
 * and constructs its `messages.json` representation.
 * The `source` is needed to keep the order of the positional arguments
 * (`$1`, `$2`, ...) consistent across languages.
 *
 * Messages with selectors always use their `*` variants,
 * and placeholder annotations are dismissed.
 * Annotations without an operand are not supported.
 */
export function resourceToExtensionJson(
  source: Map<string[], Message>,
  target: Map<string[], Message>
): JsonFile {
  const file: JsonFile = {};
  for (const [srcPath, srcMsg] of source) {
    search: for (const [trgPath, trgMsg] of target) {
      if (srcPath.length === trgPath.length) {
        for (let i = 0; i < srcPath.length; ++i) {
          if (srcPath[i] !== trgPath[i]) continue search;
        }
        const key = srcPath
          .join('_')
          .replace(/[^\w@]/g, '_')
          .toLowerCase();
        if (key in file) throw new Error(`Duplicate message key: ${key}`);
        file[key] = messageToExtensionJson(srcMsg, trgMsg);
        break search;
      }
    }
  }
  return file;
}
