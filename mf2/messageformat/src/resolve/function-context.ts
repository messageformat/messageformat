import { MessageFunctionError } from '../errors.ts';
import type { Context } from '../format-context.ts';
import { getValueSource, resolveValue } from './resolve-value.ts';
import { Options } from '../data-model/types.ts';

export class MessageFunctionContext {
  #ctx: Context;
  #litKeys: Set<string> | undefined;
  #source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto' | undefined;
  readonly id: string | undefined;
  constructor(ctx: Context, source: string, options?: Options) {
    this.#ctx = ctx;
    this.#source = source;

    this.dir = undefined;
    const dirOpt = options?.['u:dir'];
    if (dirOpt) {
      const dir = String(resolveValue(ctx, dirOpt));
      if (dir === 'ltr' || dir === 'rtl' || dir === 'auto') {
        this.dir = dir;
      } else if (dir !== 'inherit') {
        const error = new MessageFunctionError(
          'bad-option',
          'Unsupported value for u:dir option'
        );
        error.source = getValueSource(dirOpt);
        ctx.onError(error);
      }
    }

    const idOpt = options?.['u:id'];
    this.id = idOpt ? String(resolveValue(ctx, idOpt)) : undefined;

    if (options) {
      this.#litKeys = new Set();
      for (const [key, value] of Object.entries(options)) {
        if (value.type === 'literal') this.#litKeys.add(key);
      }
    }
  }

  get literalOptionKeys() {
    return new Set(this.#litKeys);
  }

  get localeMatcher() {
    return this.#ctx.localeMatcher;
  }

  get locales() {
    return this.#ctx.locales.map(String);
  }

  onError(error: unknown): void;
  onError(
    type: typeof MessageFunctionError.prototype.type,
    message: string
  ): void;
  onError(error: unknown, message?: string) {
    let mfError: MessageFunctionError;
    if (error instanceof MessageFunctionError) {
      mfError = error;
    } else if (typeof error === 'string' && typeof message === 'string') {
      mfError = new MessageFunctionError(
        error as typeof MessageFunctionError.prototype.type,
        message
      );
    } else {
      mfError = new MessageFunctionError('function-error', String(error));
      mfError.cause = error;
    }
    mfError.source = this.#source;
    this.#ctx.onError(mfError);
  }
}
