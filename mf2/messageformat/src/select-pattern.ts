import type { Message, Pattern } from './data-model/types.ts';
import { MessageSelectionError } from './errors.ts';
import type { Context } from './format-context.ts';
import { resolveVariableRef } from './resolve/resolve-variable.ts';

export function selectPattern(context: Context, message: Message): Pattern {
  switch (message.type) {
    case 'message':
      return message.pattern;

    case 'select': {
      const ctx = message.selectors.map(sel => {
        const selector = resolveVariableRef(context, sel);
        let selectKey;
        if (typeof selector.selectKey === 'function') {
          selectKey = selector.selectKey.bind(selector);
        } else {
          context.onError(new MessageSelectionError('bad-selector'));
          selectKey = () => null;
        }
        return {
          selectKey,
          best: null as string | null,
          keys: null as Set<string> | null
        };
      });

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
        try {
          sc.best = sc.keys.size ? sc.selectKey(sc.keys) : null;
        } catch (error) {
          context.onError(new MessageSelectionError('bad-selector', error));
          sc.selectKey = () => null;
          sc.best = null;
        }

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
      if (!res) {
        // This should not be possible with a valid message.
        context.onError(new MessageSelectionError('no-match'));
        return [];
      }
      return res.value;
    }

    default:
      context.onError(new MessageSelectionError('bad-selector'));
      return [];
  }
}
