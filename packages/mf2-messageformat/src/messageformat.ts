import { asDataModel, parseMessage } from './cst-parser/index.js';
import { resolveExpression } from './data-model/expression/index.js';
import { UnresolvedExpression } from './data-model/expression/variable-ref.js';
import { formatMarkup } from './data-model/markup.js';
import type { Message } from './data-model/types.js';
import { MessageError, MessageResolutionError } from './errors.js';
import type { Context } from './format-context';
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
          mv = resolveExpression(ctx, elem);
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
          mv = resolveExpression(ctx, elem);
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
    const scope = { ...msgParams };
    for (const decl of this.#message.declarations) {
      switch (decl.type) {
        case 'input':
          scope[decl.name] = new UnresolvedExpression(decl.value, msgParams);
          break;
        case 'local':
          scope[decl.name] = new UnresolvedExpression(decl.value);
          break;
        default: {
          const source = decl.keyword ?? '�';
          const msg = `Reserved ${source} annotation is not supported`;
          onError(
            new MessageResolutionError('unsupported-statement', msg, source)
          );
        }
      }
    }
    const ctx: Context = {
      onError,
      localeMatcher: this.#localeMatcher,
      locales: this.#locales,
      localVars: new WeakSet(),
      functions: this.#functions,
      scope
    };
    return ctx;
  }
}
