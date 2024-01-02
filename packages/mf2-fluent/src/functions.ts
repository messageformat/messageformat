import type { MessageFunctionContext, MessageValue } from 'messageformat';
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
    { locales, onError, source }: MessageFunctionContext,
    options: Record<string, unknown>,
    input?: unknown
  ) {
    const { msgId, msgAttr } = valueToMessageRef(input ? String(input) : '');
    const mf = res.get(msgId)?.get(msgAttr ?? '');
    if (!mf) throw new Error(`Message not available: ${msgId}`);

    let str: string | undefined;
    return {
      type: 'fluent-message' as const,
      locale: locales[0],
      source,
      selectKey(keys) {
        str ??= mf.format(options, onError);
        return keys.has(str) ? str : null;
      },
      toParts() {
        const parts = mf.formatToParts(options, onError);
        const res = { type: 'fluent-message' as const, source, parts };
        return [res] as [typeof res];
      },
      toString: () => (str ??= mf.format(options, onError)),
      valueOf: () => (str ??= mf.format(options, onError))
    } satisfies MessageValue;
  }
  Object.freeze(message);

  return { message };
}
