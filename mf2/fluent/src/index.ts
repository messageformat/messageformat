import type { Message, MessageFormat } from 'messageformat';

/**
 * A Map of {@link messageformat#MessageFormat} instances.
 *
 * @remarks
 * As each Fluent message and term may consist of a value and attributes,
 * the inner Map of this structure uses `''` as the key for the value.
 *
 * @beta
 */
export type FluentMessageResource = Map<string, Map<string, MessageFormat>>;

/**
 * A Map of {@link messageformat#Message} data structures.
 *
 * @remarks
 * As each Fluent message and term may consist of a value and attributes,
 * the inner Map of this structure uses `''` as the key for the value.
 *
 * @beta
 */
export type FluentMessageResourceData = Map<string, Map<string, Message>>;

export {
  type FluentToMessageOptions,
  fluentToMessage
} from './fluent-to-message.ts';
export {
  fluentToResource,
  fluentToResourceData
} from './fluent-to-resource.ts';
export {
  defaultFunctionMap,
  FluentMessageRef,
  messageToFluent
} from './message-to-fluent.ts';
export { resourceToFluent } from './resource-to-fluent.ts';
export { getFluentFunctions } from './functions.ts';
