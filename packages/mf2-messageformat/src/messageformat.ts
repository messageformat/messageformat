import { Message } from './data-model';
import type { Context } from './format-context';
import { MessageValue, ResolvedMessage } from './message-value';
import { parseMessage } from './parser/message';
import { resolvePatternElement } from './pattern';
import { defaultRuntime, Runtime } from './runtime';

export interface MessageFormatOptions {
  localeMatcher?: 'best fit' | 'lookup';
  runtime?: Runtime;
}

/**
 * Create a new message formatter.
 *
 * If `runtime` is unset, a default minimal set is used, consisting of `plural`
 * for selection and `datetime` & `number` formatters based on the `Intl`
 * equivalents.
 */
export class MessageFormat {
  readonly #localeMatcher: 'best fit' | 'lookup';
  readonly #locales: string[];
  readonly #message: Message;
  readonly #runtime: Readonly<Runtime>;

  constructor(
    source: string | Message,
    locales?: string | string[],
    options?: MessageFormatOptions
  ) {
    this.#localeMatcher = options?.localeMatcher ?? 'best fit';
    this.#locales = Array.isArray(locales)
      ? locales.slice()
      : locales
      ? [locales]
      : [];
    this.#message = typeof source === 'string' ? parseMessage(source) : source;
    const rt = options?.runtime ?? defaultRuntime;
    this.#runtime = Object.freeze({ ...rt });
  }

  resolveMessage(
    msgParams?: Record<string, unknown>,
    onError?: (error: unknown, value: MessageValue | undefined) => void
  ): ResolvedMessage {
    if (onError && this.#message.errors)
      for (const pErr of this.#message.errors) {
        const error = new Error(`Parse error: ${pErr.type} at ${pErr.start}`);
        onError(Object.assign(error, pErr), undefined);
      }
    const ctx = this.createContext(msgParams, onError);
    return new ResolvedMessage(ctx, this.#message);
  }

  resolvedOptions() {
    return {
      localeMatcher: this.#localeMatcher,
      locales: this.#locales.slice(),
      message: this.#message,
      runtime: this.#runtime
    };
  }

  private createContext(
    scope: Context['scope'] = {},
    onError: Context['onError'] = () => {
      // Ignore errors by default
    }
  ) {
    const { declarations } = this.#message;
    const ctx: Context = {
      onError,
      resolve: elem => resolvePatternElement(ctx, elem),
      declarations,
      localeMatcher: this.#localeMatcher,
      locales: this.#locales,
      runtime: this.#runtime,
      // If declarations exist, scope may be modified during formatting
      scope: declarations.length > 0 ? { ...scope } : scope
    };
    return ctx;
  }
}
