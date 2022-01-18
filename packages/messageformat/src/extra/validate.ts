import {
  isSelectMessage,
  MessageGroup,
  Resource,
  PatternElement
} from '../data-model';
import { isFunctionRef, isMessageRef } from '../pattern';
import type { Runtime } from '../runtime';

export function validate(
  resources: Iterable<Readonly<Resource>>,
  runtime: Runtime
) {
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
        const { msg_path, res_id } = part;
        if (res_id) {
          let found = false;
          for (const res of resources) {
            if (res.id === res_id) {
              found = true;
              break;
            }
          }
          if (!found)
            throw new ReferenceError(`Resource not available: ${res_id}`);
        }
        handleMsgParts(msg_path);
      }
    }
  }

  function handleMsgGroup({ entries }: Resource | MessageGroup) {
    for (const msg of Object.values(entries)) {
      if ('entries' in msg) handleMsgGroup(msg);
      else if (isSelectMessage(msg)) {
        handleMsgParts(msg.select.map(sel => sel.value));
        for (const { value } of msg.cases) handleMsgParts(value);
      } else handleMsgParts(msg.value);
    }
  }

  for (const res of resources) handleMsgGroup(res);
}
