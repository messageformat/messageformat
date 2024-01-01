import { asDataModel, parseMessage } from './cst-parser/index.js';
import type { Message } from './data-model';
import { MessageError, MessageResolutionError } from './errors.js';
import type { Context } from './format-context';
import {
  UnresolvedExpression,
  resolveExpression,
  resolveValue
} from './expression/index.js';
import { formatMarkup } from './markup/index.js';
import {
  MessageFunctions,
  MessagePart,
  MessageValue,
  defaultFunctions
} from './runtime/index.js';
import { selectPattern } from './select-pattern.js';

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
   * The set of custom functions available during message resolution.
   * Extends {@link defaultFunctions}.
   */
  functions?: MessageFunctions;
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
  readonly #functions: Readonly<MessageFunctions>;

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
    this.#functions = options?.functions
      ? { ...defaultFunctions, ...options.functions }
      : defaultFunctions;
  }

  format(
    msgParams?: Record<string, unknown>,
    onError?: (error: unknown) => void
  ): string {
    const ctx = this.createContext(msgParams, onError);
    let res = '';
    for (const elem of selectPattern(ctx, this.#message)) {
      if (typeof elem === 'string') {
        res += elem;
      } else if (elem.type !== 'markup') {
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
      if (typeof elem === 'string') {
        parts.push({ type: 'literal', value: elem });
      } else if (elem.type === 'markup') {
        parts.push(formatMarkup(ctx, elem));
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
      functions: Object.freeze(this.#functions),
      localeMatcher: this.#localeMatcher,
      locales: this.#locales.slice(),
      message: Object.freeze(this.#message)
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
    for (const decl of this.#message.declarations) {
      if (decl.type === 'unsupported-statement') {
        const source = decl.keyword ?? '�';
        const msg = `Reserved ${source} annotation is not supported`;
        onError(
          new MessageResolutionError('unsupported-statement', msg, source)
        );
      } else {
        const { name, value } = decl;
        const ue = new UnresolvedExpression(value, scope);
        if (name in scope) scope = { ...scope, [name]: ue };
        else scope[name] = ue;
      }
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
      functions: this.#functions,
      scope
    };
    return ctx;
  }
}
