import { asDataModel, parseMessage } from './cst-parser/index.js';
import { Message } from './data-model';
import type { Context } from './format-context';
import { MessageValue, ResolvedMessage } from './message-value';
import { resolveExpression, UnresolvedExpression } from './pattern';
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
    this.#message =
      typeof source === 'string' ? asDataModel(parseMessage(source)) : source;
    const rt = options?.runtime ?? defaultRuntime;
    this.#runtime = Object.freeze({ ...rt });
  }

  format(
    msgParams?: Record<string, unknown>,
    onError?: (error: unknown, value: MessageValue | undefined) => void
  ): string {
    const ctx = this.createContext(msgParams, onError);
    return new ResolvedMessage(ctx, this.#message).toString();
  }

  formatToParts(
    msgParams?: Record<string, unknown>,
    onError?: (error: unknown, value: MessageValue | undefined) => void
  ): MessageValue[] {
    const ctx = this.createContext(msgParams, onError);
    return new ResolvedMessage(ctx, this.#message).value;
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
    msgParams?: Record<string, unknown>,
    onError: Context['onError'] = () => {
      // Ignore errors by default
    }
  ) {
    let scope = { ...msgParams };
    for (const { name, value } of this.#message.declarations) {
      const ue = new UnresolvedExpression(value, scope);
      if (name in scope) scope = { ...scope, [name]: ue };
      else scope[name] = ue;
    }
    const ctx: Context = {
      onError,
      resolve(elem) {
        return resolveExpression(this, elem);
      },
      localeMatcher: this.#localeMatcher,
      locales: this.#locales,
      runtime: this.#runtime,
      scope
    };
    return ctx;
  }
}
