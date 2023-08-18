import { asDataModel, parseMessage } from './cst-parser/index.js';
import { Message } from './data-model';
import type { Context } from './format-context';
import { selectPattern } from './select-pattern.js';
import { resolveExpression, UnresolvedExpression } from './pattern';
import { resolveValue } from './pattern/value.js';
import { defaultRuntime, MessagePart, MessageValue, Runtime } from './runtime';
import { MessageError } from './errors.js';

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
    onError?: (error: unknown) => void
  ): string {
    const ctx = this.createContext(msgParams, onError);
    let res = '';
    for (const elem of selectPattern(ctx, this.#message)) {
      if (elem.type === 'text') {
        res += elem.value;
      } else {
        let mv: MessageValue | undefined;
        try {
          mv = ctx.resolveExpression(elem);
          if (typeof mv.toString === 'function') {
            res += mv.toString();
          } else {
            const msg = 'Message part is not formattable';
            throw new MessageError('not-formattable', msg);
          }
        } catch (error) {
          ctx.onError(error);
          res += `{${mv?.source ?? '�'}}`;
        }
      }
    }
    return res;
  }

  formatToParts(
    msgParams?: Record<string, unknown>,
    onError?: (error: unknown) => void
  ): MessagePart[] {
    const ctx = this.createContext(msgParams, onError);
    const parts: MessagePart[] = [];
    for (const elem of selectPattern(ctx, this.#message)) {
      if (elem.type === 'text') {
        parts.push({ type: 'literal', value: elem.value });
      } else {
        let mv: MessageValue | undefined;
        try {
          mv = ctx.resolveExpression(elem);
          if (typeof mv.toParts === 'function') {
            parts.push(...mv.toParts());
          } else {
            const msg = 'Message part is not formattable';
            throw new MessageError('not-formattable', msg);
          }
        } catch (error) {
          ctx.onError(error);
          parts.push({ type: 'fallback', source: mv?.source ?? '�' });
        }
      }
    }
    return parts;
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
    onError: Context['onError'] = (error: Error) => {
      // Emit warning for errors by default
      try {
        process.emitWarning(error);
      } catch {
        console.warn(error);
      }
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
      resolveExpression(elem) {
        return resolveExpression(this, elem);
      },
      resolveValue(value) {
        return resolveValue(this, value);
      },
      localeMatcher: this.#localeMatcher,
      locales: this.#locales,
      localVars: new WeakSet(),
      runtime: this.#runtime,
      scope
    };
    return ctx;
  }
}
