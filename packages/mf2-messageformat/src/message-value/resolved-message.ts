import { Message, Meta, PatternElement } from '../data-model';
import { getFormattedSelectMeta } from '../extra/detect-grammar';
import type { Context } from '../format-context';
import { fillMessageElements } from './message-element';
import { MessageValue } from './message-value';

function getPattern(
  context: Context,
  message: Message,
  onMeta: (meta: Meta) => void
): PatternElement[] {
  if (message.type === 'message') return message.pattern;

  const sel = message.match.map(({ value, fallback }) => ({
    fmt: context.resolve(value),
    def: fallback || 'other'
  }));

  cases: for (const { key, value } of message.variants) {
    const fallback = new Array<boolean>(key.length);
    for (let i = 0; i < key.length; ++i) {
      const k = key[i];
      const s = sel[i];
      if (typeof k !== 'string' || !s) continue cases;
      if (s.fmt.matchSelectKey(k)) fallback[i] = false;
      else if (s.def === k) fallback[i] = true;
      else continue cases;
    }

    const meta = getFormattedSelectMeta(message, key, sel, fallback);
    if (meta) onMeta(meta);
    return value.pattern;
  }

  onMeta({ selectResult: 'no-match' });
  return [];
}

const str = Symbol('str');

export class ResolvedMessage extends MessageValue<MessageValue[]> {
  static readonly type = 'message';

  // Cache for string value; TS complains if this is actually private
  // https://github.com/microsoft/TypeScript/issues/8277
  private declare [str]: string;

  constructor(context: Context, message: Message, source?: string) {
    let meta: Meta | undefined = message.meta;
    const pattern = getPattern(context, message, mt => {
      meta = meta ? { ...meta, ...mt } : mt;
    });
    const resMsg = pattern.map(elem => context.resolve(elem));
    fillMessageElements(resMsg);
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
