import type { Context } from '../format-context.js';
import { resolveValue } from './resolve-value.js';
import { Options } from './types.js';

export class MessageFunctionContext {
  #ctx: Context;
  #locales: string[];
  readonly source: string;
  constructor(ctx: Context, source: string, options: Options | undefined) {
    this.#ctx = ctx;
    const lc = options?.get('u:locale');
    if (lc) {
      let rl = resolveValue(ctx, lc);
      if (typeof rl === 'object' && typeof rl?.valueOf === 'function') {
        rl = rl.valueOf();
      }
      this.#locales = Array.isArray(rl) ? rl.map(String) : [String(rl)];
    } else {
      this.#locales = ctx.locales;
    }
    this.source = source;
  }
  get localeMatcher() {
    return this.#ctx.localeMatcher;
  }
  get locales() {
    return this.#locales.slice();
  }
  get onError() {
    return this.#ctx.onError;
  }
}
