import type { Context } from '../format-context.js';

export class MessageFunctionContext {
  #ctx: Context;
  readonly source: string;
  constructor(ctx: Context, source: string) {
    this.#ctx = ctx;
    this.source = source;
  }
  get localeMatcher() {
    return this.#ctx.localeMatcher;
  }
  get locales() {
    return this.#ctx.locales.slice();
  }
  get onError() {
    return this.#ctx.onError;
  }
}
