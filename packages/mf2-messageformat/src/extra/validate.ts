import type { Message, Pattern } from '../data-model';
import { isExpression, isFunctionAnnotation } from '../expression/index.js';
import type { MessageFunctions } from '../runtime';

function validateParts(parts: Pattern['body'], functions: MessageFunctions) {
  for (const part of parts) {
    if (
      isExpression(part) &&
      isFunctionAnnotation(part.annotation) &&
      part.annotation.kind === 'value'
    ) {
      const { name } = part.annotation;
      if (typeof functions[name] !== 'function') {
        throw new ReferenceError(`Runtime function not available: ${name}`);
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
 * or if it references runtime functions that are not available in the `functions`.
 *
 * Formatting a message that passes validation may still fail,
 * as it may depend on parameters that are not passed in,
 * or its runtime function calls may fail.
 *
 * @beta
 */
export function validate(msg: Readonly<Message>, functions: MessageFunctions) {
  switch (msg.type) {
    case 'message':
      validateParts(msg.pattern.body, functions);
      break;
    case 'select':
      validateParts(msg.selectors, functions);
      for (const { value } of msg.variants) {
        validateParts(value.body, functions);
      }
      break;
    default:
      // @ts-expect-error With TS, this condition should never be reached.
      throw new Error(`Invalid message type: ${msg.type}`);
  }
}
