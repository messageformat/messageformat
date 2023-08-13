import type { Message, Pattern } from './data-model';
import type { Context } from './format-context';
import { Meta } from './message-value/message-value';

export function selectPattern(
  context: Context,
  message: Message
): { pattern: Pattern['body']; meta?: Meta } {
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
      return { pattern: [] };
  }
}
