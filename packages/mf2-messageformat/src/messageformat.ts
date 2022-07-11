import { isMessage, Message, MessageGroup } from './data-model';
import type { Context } from './format-context';
import { MessageValue, ResolvedMessage } from './message-value';
import { resolvePatternElement } from './pattern';
import { defaultRuntime, Runtime } from './runtime';

export interface MessageFormatOptions {
  localeMatcher?: 'best fit' | 'lookup';
  runtime?: Runtime | ((mf: MessageFormat) => Runtime);
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
  readonly #resource: MessageGroup;
  readonly #runtime: Readonly<Runtime>;

  constructor(
    locales: string | string[],
    options: MessageFormatOptions | null,
    resource: MessageGroup
  ) {
    this.#localeMatcher = options?.localeMatcher ?? 'best fit';
    this.#locales = Array.isArray(locales) ? locales.slice() : [locales];
    const rt = options?.runtime ?? defaultRuntime;
    this.#runtime = Object.freeze({
      ...(typeof rt === 'function' ? rt(this) : rt)
    });
    this.#resource = resource;
  }

  getMessage(
    msgPath: string | Iterable<string>,
    scope: Record<string, unknown> = {},
    onError?: (error: unknown, value: MessageValue) => void
  ): ResolvedMessage | undefined {
    let msg: Message | MessageGroup;
    if (typeof msgPath === 'string') {
      msg = this.#resource.entries[msgPath];
    } else {
      msg = this.#resource;
      for (const part of msgPath) {
        if (!msg || isMessage(msg) || part == null) return undefined;
        msg = msg.entries[part];
      }
    }

    if (!isMessage(msg)) return undefined;
    const ctx = this.createContext(scope, onError);
    return new ResolvedMessage(ctx, msg);
  }

  resolvedOptions() {
    return {
      localeMatcher: this.#localeMatcher,
      locales: this.#locales.slice(),
      resource: this.#resource,
      runtime: this.#runtime
    };
  }

  private createContext(
    scope: Context['scope'],
    onError: Context['onError'] = () => {
      // Ignore errors by default
    }
  ): Context {
    return {
      onError,
      resolve(elem) {
        return resolvePatternElement(this, elem);
      },
      localeMatcher: this.#localeMatcher,
      locales: this.#locales,
      runtime: this.#runtime,
      scope
    };
  }
}
