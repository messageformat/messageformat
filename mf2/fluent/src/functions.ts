import type { MessagePart } from 'messageformat';
import type {
  MessageFunctionContext,
  MessageValue
} from 'messageformat/functions';
import { getLocaleDir } from 'messageformat/functions/utils';
import type { FluentMessageResource } from './index.js';
import { valueToMessageRef } from './message-to-fluent.js';

/**
 * Build a {@link messageformat#MessageFormat} runtime to use with Fluent messages.
 *
 * @remarks
 * This builds on top of the default runtime, but uses all-caps names for the
 * `DATETIME` and `NUMBER` message formatters.
 * A custom function `MESSAGE` is also included to support
 * Fluent term and message references.
 *
 * @beta
 * @param res - A Map of MessageFormat instances, for use by `MESSAGE`.
 *   This Map may be passed in as initially empty, and later filled out by the caller.
 */
export function getFluentFunctions(res: FluentMessageResource) {
  function message(
    ctx: MessageFunctionContext,
    options: Record<string, unknown>,
    input?: unknown
  ) {
    const { onError, source } = ctx;
    const locale = ctx.locales[0];
    const dir = ctx.dir ?? getLocaleDir(locale);
    const { msgId, msgAttr } = valueToMessageRef(input ? String(input) : '');
    const mf = res.get(msgId)?.get(msgAttr ?? '');
    if (!mf) throw new Error(`Message not available: ${msgId}`);

    let str: string | undefined;
    return {
      type: 'fluent-message' as const,
      source,
      dir,
      selectKey(keys) {
        str ??= mf.format(options, onError);
        return keys.has(str) ? str : null;
      },
      toParts(): [
        {
          type: 'fluent-message';
          source: string;
          dir?: 'ltr' | 'rtl';
          parts: MessagePart[];
        }
      ] {
        const parts = mf.formatToParts(options, onError);
        const res =
          dir === 'ltr' || dir === 'rtl'
            ? { type: 'fluent-message' as const, source, dir, locale, parts }
            : { type: 'fluent-message' as const, source, locale, parts };
        return [res];
      },
      toString: () => (str ??= mf.format(options, onError)),
      valueOf: () => (str ??= mf.format(options, onError))
    } satisfies MessageValue;
  }
  Object.freeze(message);

  return { 'fluent:message': message };
}
