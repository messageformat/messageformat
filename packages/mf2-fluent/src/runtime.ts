import { defaultRuntime, MessageValue, RuntimeOptions } from 'messageformat';
import type { FluentMessageResource } from '.';
import { valueToMessageRef } from './message-to-fluent';

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
export function getFluentRuntime(res: FluentMessageResource) {
  function MESSAGE(
    _locales: string[],
    options: RuntimeOptions,
    arg?: MessageValue
  ) {
    const { msgId, msgAttr } = valueToMessageRef(arg?.toString() ?? '');
    const mf = res.get(msgId)?.get(msgAttr ?? '');
    if (!mf) throw new Error(`Message not available: ${msgId}`);
    const msg = mf.resolveMessage(options);
    msg.source = msgId;
    return msg;
  }
  Object.freeze(MESSAGE);

  return {
    DATETIME: defaultRuntime.datetime,
    MESSAGE,
    NUMBER: defaultRuntime.number
  };
}
