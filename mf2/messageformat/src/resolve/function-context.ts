import { MessageResolutionError } from '../errors.ts';
import type { Context } from '../format-context.ts';
import { getValueSource, resolveValue } from './resolve-value.ts';
import { Options } from '../data-model/types.ts';

export class MessageFunctionContext {
  #ctx: Context;
  #litKeys: Set<string> | undefined;
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
      } else if (dir !== 'inherit') {
        const msg = 'Unsupported value for u:dir option';
        const optSource = getValueSource(dirOpt);
        ctx.onError(new MessageResolutionError('bad-option', msg, optSource));
      }
    }

    const idOpt = options?.get('u:id');
    this.id = idOpt ? String(resolveValue(ctx, idOpt)) : undefined;

    if (options) {
      this.#litKeys = new Set();
      for (const [key, value] of options) {
        if (value.type === 'literal') this.#litKeys.add(key);
      }
    }

    this.source = source;
  }

  get literalOptionKeys() {
    return new Set(this.#litKeys);
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
