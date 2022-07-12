import type { Message } from '../data-model';
import { getFormattedSelectMeta } from '../extra/detect-grammar';
import type { Context } from '../format-context';
import type { PatternElement } from '../pattern';
import { fillMessageMarkups } from './message-markup';
import { MessageValue, Meta } from './message-value';

function getPattern(
  context: Context,
  message: Message
): { pattern: PatternElement[]; meta: Meta | undefined } {
  if (message.type === 'message')
    return { pattern: message.pattern.body, meta: undefined };

  const rs = message.selectors.map(sel => context.resolve(sel));

  cases: for (const { keys, value } of message.variants) {
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (key.type !== '*' && !rs[i].matchSelectKey(key.value)) {
        continue cases;
      }
    }

    const meta = getFormattedSelectMeta(message, keys);
    return { pattern: value.body, meta };
  }

  return { pattern: [], meta: { selectResult: 'no-match' } };
}

const str = Symbol('str');

export class ResolvedMessage extends MessageValue<MessageValue[]> {
  static readonly type = 'message';

  // Cache for string value; TS complains if this is actually private
  // https://github.com/microsoft/TypeScript/issues/8277
  private declare [str]: string;

  constructor(context: Context, message: Message, source?: string) {
    const { meta, pattern } = getPattern(context, message);
    const resMsg = pattern.map(elem => context.resolve(elem));
    fillMessageMarkups(resMsg);
    super(ResolvedMessage.type, context, resMsg, { meta, source });
  }

  matchSelectKey(key: string) {
    return this.toString() === key;
  }

  toString(onError?: Context['onError'], noCache = false) {
    if (noCache || typeof this[str] !== 'string') {
      this[str] = '';
      for (const mv of this.value) this[str] += mv.toString(onError);
    }
    return this[str];
  }
}
