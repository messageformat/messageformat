import type { Message } from '../data-model';
import type { Context } from '../format-context';
import type { PatternElement } from '../pattern';
import { MessageValue, Meta } from './message-value';

const MESSAGE = 'message';

function getPattern(
  context: Context,
  message: Message
): { pattern: PatternElement[]; meta?: Meta } {
  switch (message.type) {
    case 'message':
      return { pattern: message.pattern.body };

    case 'select': {
      const resSelectors = message.selectors.map(sel => context.resolve(sel));

      cases: for (const { keys, value } of message.variants) {
        let meta: Meta | undefined = undefined;
        for (let i = 0; i < keys.length; ++i) {
          const key = keys[i];
          const rs = resSelectors[i];
          const match = key.type === '*' || rs?.matchSelectKey(key.value);
          if (!match) continue cases;
          if (typeof match === 'object')
            meta = Object.assign(meta ?? {}, match);
        }
        return { pattern: value.body, meta };
      }

      return { pattern: [], meta: { selectResult: 'no-match' } };
    }

    default:
      return { pattern: [{ type: 'junk', source: message.source }] };
  }
}

/**
 * The result of resolving a {@link MessageFormat} message.
 *
 * @beta
 */
export class ResolvedMessage extends MessageValue<MessageValue[]> {
  // Cache for string value
  #str: string | undefined;

  constructor(context: Context, message: Message, source?: string) {
    const { meta, pattern } = getPattern(context, message);
    const resMsg = pattern.map(elem => context.resolve(elem));
    super(MESSAGE, context, resMsg, { meta, source });
  }

  matchSelectKey(key: string) {
    return this.toString() === key;
  }

  toString(onError?: Context['onError'], noCache = false) {
    if (noCache || typeof this.#str !== 'string') {
      this.#str = '';
      for (const mv of this.value) this.#str += mv.toString(onError);
    }
    return this.#str;
  }
}
