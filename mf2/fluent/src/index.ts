import type { MessageFormat, Model } from 'messageformat';

/**
 * A Map of {@link MessageFormat} instances.
 *
 * As each Fluent message and term may consist of a value and attributes,
 * the inner Map of this structure uses `''` as the key for the value.
 */
export type FluentMessageResource = Map<string, Map<string, MessageFormat>>;

/**
 * A Map of {@link Model.Message} data structures.
 *
 * As each Fluent message and term may consist of a value and attributes,
 * the inner Map of this structure uses `''` as the key for the value.
 */
export type FluentMessageResourceData = Map<string, Map<string, Model.Message>>;

export { fluentToMessage } from './fluent-to-message.ts';
export {
  fluentToResource,
  fluentToResourceData
} from './fluent-to-resource.ts';
export { getMessageFunction } from './functions.ts';
export { messageToFluent } from './message-to-fluent.ts';
export { resourceToFluent } from './resource-to-fluent.ts';
