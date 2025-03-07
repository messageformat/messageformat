import type { Model as MF, MessageFormat } from 'messageformat';

/**
 * A Map of {@link MessageFormat} instances.
 *
 * As each Fluent message and term may consist of a value and attributes,
 * the inner Map of this structure uses `''` as the key for the value.
 */
export type FluentMessageResource = Map<string, Map<string, MessageFormat>>;

/**
 * A Map of {@link MF.Message} data structures.
 *
 * As each Fluent message and term may consist of a value and attributes,
 * the inner Map of this structure uses `''` as the key for the value.
 */
export type FluentMessageResourceData = Map<string, Map<string, MF.Message>>;

export {
  fluentToMessage,
  type FluentToMessageOptions
} from './fluent-to-message.ts';
export {
  fluentToResource,
  fluentToResourceData
} from './fluent-to-resource.ts';
export { getFluentFunctions } from './functions.ts';
export {
  defaultFunctionMap,
  FluentMessageRef,
  messageToFluent,
  type FunctionMap
} from './message-to-fluent.ts';
export { resourceToFluent } from './resource-to-fluent.ts';
