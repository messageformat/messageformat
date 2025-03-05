import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MessageFormat,
  MessageFunctions,
  MessagePart
} from 'messageformat';
import type {
  MessageFunctionContext,
  MessageValue
} from 'messageformat/functions';
import { DraftFunctions, getLocaleDir } from 'messageformat/functions';
import type { FluentMessageResource } from './index.ts';
import { valueToMessageRef } from './message-to-fluent.ts';

/**
 * Build a {@link MessageFormat} runtime to use with Fluent messages.
 *
 * This builds on top of the default runtime, but uses all-caps names for the
 * `DATETIME` and `NUMBER` message formatters.
 * A custom function `MESSAGE` is also included to support
 * Fluent term and message references.
 *
 * @param res - A Map of MessageFormat instances, for use by `MESSAGE`.
 *   This Map may be passed in as initially empty, and later filled out by the caller.
 */
export function getFluentFunctions(
  res: FluentMessageResource
): MessageFunctions {
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

  return {
    currency: DraftFunctions.currency,
    unit: DraftFunctions.unit,
    'fluent:message': message
  };
}
