import type { Message, Pattern } from '../data-model';
import { isExpression, isFunctionRef } from '../pattern';
import type { Runtime } from '../runtime';

function validateParts(parts: Pattern['body'], runtime: Runtime) {
  for (const part of parts) {
    if (
      isExpression(part) &&
      isFunctionRef(part.body) &&
      part.body.kind === 'value'
    ) {
      if (typeof runtime[part.body.name] !== 'function') {
        throw new ReferenceError(
          `Runtime function not available: ${part.body.name}`
        );
      }
      // TODO: Once runtime arg requirements are defined, test against them
    }
  }
}

/**
 * Validate a message.
 *
 * @remarks
 * Throws if `msg` is not a pattern or select message,
 * or if it references runtime functions that are not available in the `runtime`.
 *
 * Formatting a message that passes validation may still fail,
 * as it may depend on parameters that are not passed in,
 * or its runtime function calls may fail.
 *
 * @beta
 */
export function validate(msg: Readonly<Message>, runtime: Runtime) {
  if (msg.errors?.length) throw msg.errors[0];
  switch (msg.type) {
    case 'message':
      validateParts(msg.pattern.body, runtime);
      break;
    case 'select':
      validateParts(msg.selectors, runtime);
      for (const { value } of msg.variants) validateParts(value.body, runtime);
      break;
    default:
      // @ts-expect-error With TS, this condition should never be reached.
      throw new Error(`Invalid message type: ${msg.type}`);
  }
}
