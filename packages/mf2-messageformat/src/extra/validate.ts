import {
  isSelectMessage,
  MessageGroup,
  Resource,
  PatternElement
} from '../data-model';
import { isFunctionRef, isMessageRef } from '../pattern';
import type { Runtime } from '../runtime';

export function validate(resource: Readonly<Resource>, runtime: Runtime) {
  function handleMsgParts(parts: PatternElement[]) {
    for (const part of parts) {
      if (isFunctionRef(part)) {
        const { args, func } = part;
        const fn = runtime[func];
        if (!fn || typeof fn !== 'object' || typeof fn.call !== 'function')
          throw new ReferenceError(`Runtime function not available: ${func}`);
        handleMsgParts(args);
        // TODO: Once runtime arg requirements are defined, test against them
      } else if (isMessageRef(part)) {
        handleMsgParts(part.msg_path);
      }
    }
  }

  function handleMsgGroup({ entries }: Resource | MessageGroup) {
    for (const msg of Object.values(entries)) {
      if ('entries' in msg) handleMsgGroup(msg);
      else if (isSelectMessage(msg)) {
        handleMsgParts(msg.select.map(sel => sel.value));
        for (const { value } of msg.cases) handleMsgParts(value.pattern);
      } else handleMsgParts(msg.pattern);
    }
  }

  handleMsgGroup(resource);
}
