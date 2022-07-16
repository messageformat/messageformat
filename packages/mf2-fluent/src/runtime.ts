import {
  defaultRuntime,
  MessageFormat,
  MessageValue,
  ResolvedMessage,
  RuntimeFunction,
  RuntimeOptions
} from 'messageformat';

/**
 * Build a {@link messageformat#MessageFormat} runtime to use with Fluent messages.
 *
 * This builds on top of the default runtime, but uses all-caps names for the
 * `DATETIME` and `NUMBER` message formatters.
 * A custom function `MESSAGE` is also included to support
 * Fluent term and message references.
 *
 * @beta
 * @param res - A Map of MessageFormat instances, for use by `MESSAGE`.
 *   This Map may be passed in as initially empty, and later filled out by the caller.
 */
export function getFluentRuntime(res: Map<string, MessageFormat>) {
  const MESSAGE: RuntimeFunction<ResolvedMessage> = {
    call: function resolveMessageRef(
      _locales: string[],
      options: RuntimeOptions,
      arg?: MessageValue
    ) {
      const msgId = arg?.toString() ?? '';
      const mf = res.get(msgId);
      if (!mf) throw new Error(`Message not available: ${msgId}`);
      const msg = mf.resolveMessage(options);
      msg.source = msgId;
      return msg;
    },
    options: 'any'
  };

  return {
    DATETIME: defaultRuntime.datetime,
    MESSAGE,
    NUMBER: defaultRuntime.number
  };
}
