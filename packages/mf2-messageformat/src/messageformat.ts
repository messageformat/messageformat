import { Message } from './data-model';
import type { Context } from './format-context';
import { MessageValue, ResolvedMessage } from './message-value';
import { parseMessage } from './parser/message';
import { resolvePatternElement } from './pattern';
import { defaultRuntime, Runtime } from './runtime';

/** @beta */
export interface MessageFormatOptions {
  /**
   * If given multiple locales,
   * determines which algorithm to use when selecting between them;
   * the default for `Intl` formatters is `'best fit'`.
   *
   * @remarks
   * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_negotiation
   */
  localeMatcher?: 'best fit' | 'lookup';

  /**
   * The set of functions available during message resolution.
   * If not set, defaults to {@link defaultRuntime}.
   */
  runtime?: Runtime;
}

/**
 * Create a new message formatter.
 *
 * @beta
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
