import { MessageValue, ResolvedMessage } from '../message-value';
import { MessageFormat } from '../messageformat';
import { datetime, number } from './default';
import type { RuntimeFunction, RuntimeOptions } from './index';

export function getFluentRuntime(mf: MessageFormat) {
  const MESSAGE: RuntimeFunction<ResolvedMessage> = {
    call: function resolveMessageRef(
      _locales: string[],
      options: RuntimeOptions | undefined,
      arg: MessageValue
    ) {
      const msgId = arg.toString();
      const msg = mf.getMessage(msgId, options ?? {});
      if (!msg) throw new Error(`Message not available: ${msgId}`);
      msg.source = msgId;
      return msg;
    },
    options: 'any'
  };

  return {
    DATETIME: datetime,
    MESSAGE,
    NUMBER: number
  };
}
