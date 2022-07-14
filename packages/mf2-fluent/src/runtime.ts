import {
  defaultRuntime,
  MessageFormat,
  MessageValue,
  ResolvedMessage,
  RuntimeFunction,
  RuntimeOptions
} from 'messageformat';

export function getFluentRuntime(res: Map<string, MessageFormat>) {
  const MESSAGE: RuntimeFunction<ResolvedMessage> = {
    call: function resolveMessageRef(
      _locales: string[],
      options: RuntimeOptions | undefined,
      arg: MessageValue
    ) {
      const msgId = arg.toString();
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
