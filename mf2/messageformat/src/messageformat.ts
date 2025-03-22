import { parseMessage } from './data-model/parse.ts';
import type { Message } from './data-model/types.ts';
import { validate } from './data-model/validate.ts';
import { FSI, LRI, PDI, RLI, getLocaleDir } from './dir-utils.ts';
import { MessageDataModelError, MessageError } from './errors.ts';
import type { Context } from './format-context.ts';
import type { MessageFallbackPart, MessagePart } from './formatted-parts.ts';
import { DefaultFunctions } from './functions/index.ts';
import { BIDI_ISOLATE, type MessageValue } from './message-value.ts';
import { formatMarkup } from './resolve/format-markup.ts';
import type { MessageFunctionContext } from './resolve/function-context.ts';
import { resolveExpression } from './resolve/resolve-expression.ts';
import { UnresolvedExpression } from './resolve/resolve-variable.ts';
import { selectPattern } from './select-pattern.ts';

type DefaultFunctionTypes = ReturnType<
  (typeof DefaultFunctions)[keyof typeof DefaultFunctions]
>['type'];

/**
 * An MF2 function handler, for use in {@link MessageFormatOptions.functions}.
 *
 * @category Formatting
 */
export type MessageFunction<T extends string, P extends string = T> = (
  context: MessageFunctionContext,
  options: Record<string, unknown>,
  input?: unknown
) => MessageValue<T, P>;

/** @category Formatting */
export interface MessageFormatOptions<
  T extends string = never,
  P extends string = T
> {
  /**
   * The bidi isolation strategy for message formatting,
   * i.e. how expression placeholders with different or unknown directionalities
   * are isolated from the rest of the formatted message.
   *
   * The default `'default'` strategy isolates all expression placeholders,
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
   * The locale is resolved separately by each message function handler call.
   *
   * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_negotiation
   */
  localeMatcher?: 'best fit' | 'lookup';

  /**
   * A set of custom functions to make available during message resolution.
   * Extends the {@link DefaultFunctions} set of functions.
   */
  functions?: Record<string, MessageFunction<T, P>>;
}

/**
 * A message formatter that implements the [ECMA-402 Intl.MessageFormat proposal].
 *
 * [ecma-402 intl.messageformat proposal]: https://github.com/tc39/proposal-intl-messageformat/
 *
 * @category Formatting
 */
export class MessageFormat<T extends string = never, P extends string = T> {
  readonly #bidiIsolation: boolean;
  readonly #dir: 'ltr' | 'rtl' | 'auto';
  readonly #localeMatcher: 'best fit' | 'lookup';
  readonly #locales: Intl.Locale[];
  readonly #message: Message;
  readonly #functions: Record<
    string,
    MessageFunction<T | DefaultFunctionTypes, P | DefaultFunctionTypes>
  >;

  constructor(
    locales: string | string[] | undefined,
    source: string | Message,
    options?: MessageFormatOptions<T, P>
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

  /**
   * Format a message to a string.
   *
   * ```js
   * import { MessageFormat } from 'messageformat';
   * import { DraftFunctions } from 'messageformat/functions';
   *
   * const msg = 'Hello {$user.name}, today is {$date :date style=long}';
   * const mf = new MessageFormat('en', msg, { functions: DraftFunctions });
   * mf.format({ user: { name: 'Kat' }, date: new Date('2025-03-01') });
   * ```
   *
   * ```js
   * 'Hello Kat, today is March 1, 2025'
   * ```
   *
   * @param msgParams - Values that may be referenced by `$`-prefixed variable references.
   *   To refer to an inner property of an object value,
   *   use `.` as a separator; in case of conflict, the longest starting substring wins.
   * @param onError - Called in case of error.
   *   If not set, errors are by default logged as warnings.
   */
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
        let mv: MessageValue<string> | undefined;
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

  /**
   * Format a message to a sequence of parts.
   *
   * ```js
   * import { MessageFormat } from 'messageformat';
   * import { DraftFunctions } from 'messageformat/functions';
   *
   * const msg = 'Hello {$user.name}, today is {$date :date style=long}';
   * const mf = new MessageFormat('en', msg, { functions: DraftFunctions });
   * mf.formatToParts({ user: { name: 'Kat' }, date: new Date('2025-03-01') });
   * ```
   *
   * ```js
   * [
   *   { type: 'text', value: 'Hello ' },
   *   { type: 'bidiIsolation', value: '\u2068' },
   *   { type: 'string', source: '$user.name', locale: 'en', value: 'Kat' },
   *   { type: 'bidiIsolation', value: '\u2069' },
   *   { type: 'text', value: ', today is ' },
   *   {
   *     type: 'datetime',
   *     source: '$date',
   *     dir: 'ltr',
   *     locale: 'en',
   *     parts: [
   *       { type: 'month', value: 'March' },
   *       { type: 'literal', value: ' ' },
   *       { type: 'day', value: '1' },
   *       { type: 'literal', value: ', ' },
   *       { type: 'year', value: '2025' }
   *     ]
   *   }
   * ]
   * ```
   *
   * @param msgParams - Values that may be referenced by `$`-prefixed variable references.
   *   To refer to an inner property of an object value,
   *   use `.` as a separator; in case of conflict, the longest starting substring wins.
   * @param onError - Called in case of error.
   *   If not set, errors are by default logged as warnings.
   */
  formatToParts(
    msgParams?: Record<string, unknown>,
    onError?: (error: unknown) => void
  ): MessagePart<P>[] {
    const ctx = this.createContext(msgParams, onError);
    const parts: MessagePart<P>[] = [];
    for (const elem of selectPattern(ctx, this.#message)) {
      if (typeof elem === 'string') {
        parts.push({ type: 'text', value: elem });
      } else if (elem.type === 'markup') {
        parts.push(formatMarkup(ctx, elem));
      } else {
        let mv;
        try {
          mv = resolveExpression(ctx, elem);
          if (typeof mv.toParts === 'function') {
            // Let's presume that parts that look like MessageNumberPart or MessageStringPart are such.
            const mp = mv.toParts() as typeof parts;
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
          const fb: MessageFallbackPart = {
            type: 'fallback',
            source: mv?.source ?? '�'
          };
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
    const ctx: Context<T | DefaultFunctionTypes, P | DefaultFunctionTypes> = {
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
