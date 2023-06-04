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
      const ctx = message.selectors.map(sel => ({
        selector: context.resolve(sel),
        best: null as string | null,
        keys: null as Set<string> | null
      }));

      let candidates = message.variants;
      loop: for (let i = 0; i < ctx.length; ++i) {
        const sc = ctx[i];
        if (!sc.keys) {
          sc.keys = new Set();
          for (const { keys } of candidates) {
            const key = keys[i];
            if (!key) break loop; // key-mismatch error
            if (key.type !== '*') sc.keys.add(key.value);
          }
        }
        sc.best = sc.keys.size ? sc.selector.selectKey(sc.keys) : null;

        // Leave out all candidate variants that aren't the best,
        // or only the catchall ones, if nothing else matches.
        candidates = candidates.filter(v => {
          const k = v.keys[i];
          if (k.type === '*') return sc.best == null;
          return sc.best === k.value;
        });

        // If we've run out of candidates,
        // drop the previous best key of the preceding selector,
        // reset all subsequent key sets,
        // and restart the loop.
        if (candidates.length === 0) {
          if (i === 0) break; // No match; should not happen
          const prev = ctx[i - 1];
          if (prev.best == null) prev.keys?.clear();
          else prev.keys?.delete(prev.best);
          for (let j = i; j < ctx.length; ++j) ctx[j].keys = null;
          candidates = message.variants;
          i = -1;
        }
      }

      const res = candidates[0];
      return res
        ? { pattern: res.value.body }
        : { pattern: [], meta: { selectResult: 'no-match' } };
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

  selectKey(keys: Set<string>) {
    let hasError = false;
    const str = this.toString(() => (hasError = true));
    return !hasError && keys.has(str) ? str : null;
  }

  toString(onError?: Context['onError']) {
    if (typeof this.#str !== 'string') {
      this.#str = '';
      for (const mv of this.value) this.#str += mv.toString(onError);
    }
    return this.#str;
  }
}
