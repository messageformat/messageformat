import type { Message, Pattern } from './data-model/types.ts';
import { MessageResolutionError } from './errors.ts';
import type { Context } from './format-context.ts';
import { resolveVariableRef } from './resolve/resolve-variable.ts';

export function selectPattern(context: Context, message: Message): Pattern {
  if (message.type === 'message') return message.pattern;

  // message.type === 'select'
  const ctx = message.selectors.map(sel => {
    const selector = resolveVariableRef(context, sel);
    let selectKey;
    if (typeof selector.selectKey === 'function') {
      selectKey = selector.selectKey.bind(selector);
    } else {
      const msg = 'Selector does not support selection';
      context.onError(
        new MessageResolutionError('bad-selector', msg, selector.source)
      );
      selectKey = () => null;
    }
    return {
      selectKey,
      source: selector.source,
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
      const msg = 'Selection failed';
      context.onError(
        new MessageResolutionError('bad-selector', msg, sc.source, error)
      );
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
    const msg = 'No variant was selected!?';
    context.onError(new MessageResolutionError('no-match', msg, '.match'));
    return [];
  }
  return res.value;
}
