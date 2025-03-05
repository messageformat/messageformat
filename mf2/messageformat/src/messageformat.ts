import { parseMessage } from './data-model/parse.ts';
import type { Message } from './data-model/types.ts';
import { validate } from './data-model/validate.ts';
import { FSI, LRI, PDI, RLI, getLocaleDir } from './dir-utils.ts';
import { MessageDataModelError, MessageError } from './errors.ts';
import type { Context } from './format-context.ts';
import type { MessagePart } from './formatted-parts.ts';
import { DefaultFunctions } from './functions/index.ts';
import { BIDI_ISOLATE, type MessageValue } from './message-value.ts';
import { formatMarkup } from './resolve/format-markup.ts';
import type { MessageFunctionContext } from './resolve/function-context.ts';
import { resolveExpression } from './resolve/resolve-expression.ts';
import { UnresolvedExpression } from './resolve/resolve-variable.ts';
import { selectPattern } from './select-pattern.ts';

/**
 * The runtime function registry available when resolving {@link FunctionRef} elements.
 */
export interface MessageFunctions {
  [key: string]: (
    context: MessageFunctionContext,
    options: Record<string, unknown>,
    input?: unknown
  ) => MessageValue;
}

export interface MessageFormatOptions {
  /**
   * The bidi isolation strategy for messages,
   * i.e. how parts with different or unknown directionalities are isolated from each other.
   *
   * The default `'default'` strategy isolates all placeholders,
   * except when both the message and the placeholder are known to be left-to-right.
   *
   * The `'none'` strategy applies no isolation at all.
   */
  bidiIsolation?: 'default' | 'none';

  /**
   * Explicitly set the message's base direction.
   * If not set, the direction is detected from the primary locale.
   */
  dir?: 'ltr' | 'rtl' | 'auto';

  /**
   * If given multiple locales,
   * determines which algorithm to use when selecting between them;
   * the default for `Intl` formatters is `'best fit'`.
   *
   * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_negotiation
   */
  localeMatcher?: 'best fit' | 'lookup';

  /**
   * The set of custom functions available during message resolution.
   * Extends the default set of functions.
   */
  functions?: MessageFunctions;
}

/**
 * Creates a new message formatter.
 */
export class MessageFormat {
  readonly #bidiIsolation: boolean;
  readonly #dir: 'ltr' | 'rtl' | 'auto';
  readonly #localeMatcher: 'best fit' | 'lookup';
  readonly #locales: Intl.Locale[];
  readonly #message: Message;
  readonly #functions: Readonly<MessageFunctions>;

  constructor(
    locales: string | string[] | undefined,
    source: string | Message,
    options?: MessageFormatOptions
  ) {
    this.#bidiIsolation = options?.bidiIsolation !== 'none';
    this.#localeMatcher = options?.localeMatcher ?? 'best fit';
    this.#locales = Array.isArray(locales)
      ? locales.map(lc => new Intl.Locale(lc))
      : locales
        ? [new Intl.Locale(locales)]
        : [];
    this.#dir = options?.dir ?? getLocaleDir(this.#locales[0]);
    this.#message = typeof source === 'string' ? parseMessage(source) : source;
    validate(this.#message, (type, node) => {
      throw new MessageDataModelError(type, node);
    });
    this.#functions = options?.functions
      ? { ...DefaultFunctions, ...options.functions }
      : DefaultFunctions;
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
      } else if (elem.type === 'markup') {
        // Handle errors, but discard results
        formatMarkup(ctx, elem);
      } else {
        let mv: MessageValue | undefined;
        try {
          mv = resolveExpression(ctx, elem);
          if (typeof mv.toString === 'function') {
            if (
              this.#bidiIsolation &&
              (this.#dir !== 'ltr' || mv.dir !== 'ltr' || mv[BIDI_ISOLATE])
            ) {
              const pre = mv.dir === 'ltr' ? LRI : mv.dir === 'rtl' ? RLI : FSI;
              res += pre + mv.toString() + PDI;
            } else {
              res += mv.toString();
            }
          } else {
            const msg = 'Message part is not formattable';
            throw new MessageError('not-formattable', msg);
          }
        } catch (error) {
          ctx.onError(error);
          const errStr = `{${mv?.source ?? '�'}}`;
          res += this.#bidiIsolation ? FSI + errStr + PDI : errStr;
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
            const mp = mv.toParts();
            if (
              this.#bidiIsolation &&
              (this.#dir !== 'ltr' || mv.dir !== 'ltr' || mv[BIDI_ISOLATE])
            ) {
              const pre = mv.dir === 'ltr' ? LRI : mv.dir === 'rtl' ? RLI : FSI;
              parts.push({ type: 'bidiIsolation', value: pre }, ...mp, {
                type: 'bidiIsolation',
                value: PDI
              });
            } else {
              parts.push(...mp);
            }
          } else {
            const msg = 'Message part is not formattable';
            throw new MessageError('not-formattable', msg);
          }
        } catch (error) {
          ctx.onError(error);
          const fb = { type: 'fallback', source: mv?.source ?? '�' };
          if (this.#bidiIsolation) {
            parts.push({ type: 'bidiIsolation', value: FSI }, fb, {
              type: 'bidiIsolation',
              value: PDI
            });
          } else {
            parts.push(fb);
          }
        }
      }
    }
    return parts;
  }

  resolvedOptions() {
    return {
      bidiIsolation: this.#bidiIsolation,
      dir: this.#dir,
      functions: Object.freeze(this.#functions),
      localeMatcher: this.#localeMatcher
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
      scope[decl.name] = new UnresolvedExpression(
        decl.value,
        decl.type === 'input' ? (msgParams ?? {}) : undefined
      );
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
