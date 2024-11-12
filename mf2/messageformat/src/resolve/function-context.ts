import { MessageResolutionError } from '../errors.js';
import type { Context } from '../format-context.js';
import { getValueSource, resolveValue } from './resolve-value.js';
import { Options } from '../data-model/types.js';

export class MessageFunctionContext {
  #ctx: Context;
  #locales: Intl.Locale[];
  readonly dir: 'ltr' | 'rtl' | 'auto' | undefined;
  readonly id: string | undefined;
  readonly source: string;
  constructor(ctx: Context, source: string, options?: Options) {
    this.#ctx = ctx;

    this.#locales = ctx.locales;
    const localeOpt = options?.get('u:locale');
    if (localeOpt) {
      let rl = resolveValue(ctx, localeOpt);
      try {
        if (typeof rl === 'object' && typeof rl?.valueOf === 'function') {
          rl = rl.valueOf();
        }
        this.#locales = Array.isArray(rl)
          ? rl.map(lc => new Intl.Locale(lc))
          : [new Intl.Locale(String(rl))];
      } catch {
        const msg = 'Unsupported value for u:locale option';
        const optSource = getValueSource(localeOpt);
        ctx.onError(new MessageResolutionError('bad-option', msg, optSource));
      }
    }

    this.dir = undefined;
    const dirOpt = options?.get('u:dir');
    if (dirOpt) {
      const dir = String(resolveValue(ctx, dirOpt));
      if (dir === 'ltr' || dir === 'rtl' || dir === 'auto') {
        this.dir = dir;
      } else {
        const msg = 'Unsupported value for u:dir option';
        const optSource = getValueSource(dirOpt);
        ctx.onError(new MessageResolutionError('bad-option', msg, optSource));
      }
    }

    const idOpt = options?.get('u:id');
    this.id = idOpt ? String(resolveValue(ctx, idOpt)) : undefined;

    this.source = source;
  }

  get localeMatcher() {
    return this.#ctx.localeMatcher;
  }

  get locales() {
    return this.#locales.map(String);
  }

  get onError() {
    return this.#ctx.onError;
  }
}
