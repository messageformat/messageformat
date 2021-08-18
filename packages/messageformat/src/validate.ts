import { isFunction, isTerm, MessageGroup, Part, Resource } from './data-model';
import type { Runtime } from './runtime';

export function validate(resources: Resource[], runtime: Runtime) {
  function handleMsgParts(parts: Part[], inSelect?: boolean) {
    for (const part of parts) {
      if (isFunction(part)) {
        const { args, func } = part;
        const realm = inSelect ? runtime.select : runtime.format;
        const fn = realm[func];
        if (typeof fn !== 'function')
          throw new ReferenceError(`Runtime function not available: ${func}`);
        handleMsgParts(args);
        // TODO: Once runtime arg requirements are defined, test against them
      } else if (isTerm(part)) {
        const { msg_path, res_id } = part;
        if (res_id && resources.every(res => res.id !== res_id))
          throw new ReferenceError(`Resource not available: ${res_id}`);
        handleMsgParts(msg_path);
      }
    }
  }

  function handleMsgGroup({ entries }: MessageGroup) {
    for (const msg of Object.values(entries)) {
      if ('entries' in msg) handleMsgGroup(msg);
      else if (Array.isArray(msg.value)) handleMsgParts(msg.value);
      else {
        handleMsgParts(
          msg.value.select.map(sel => sel.value),
          true
        );
        for (const { value } of msg.value.cases) handleMsgParts(value);
      }
    }
  }

  for (const res of resources) handleMsgGroup(res);
}
