import { isSelectMessage, Message } from '../data-model';
import { isExpression, PatternElement } from '../pattern';
import type { Runtime } from '../runtime';

function validateParts(parts: PatternElement[], runtime: Runtime) {
  for (const part of parts) {
    if (isExpression(part)) {
      const fn = runtime[part.name];
      if (!fn || typeof fn !== 'object' || typeof fn.call !== 'function') {
        throw new ReferenceError(
          `Runtime function not available: ${part.name}`
        );
      }
      // TODO: Once runtime arg requirements are defined, test against them
    }
  }
}

export function validate(msg: Readonly<Message>, runtime: Runtime) {
  if (isSelectMessage(msg)) {
    validateParts(msg.selectors, runtime);
    for (const { value } of msg.variants) validateParts(value.body, runtime);
  } else {
    validateParts(msg.pattern.body, runtime);
  }
}
