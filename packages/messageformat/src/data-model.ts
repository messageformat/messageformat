/* eslint-disable @typescript-eslint/no-explicit-any */

//// RESOURCES ////

/**
 * The root of a message structure is a Resource. It is somewhat (but not
 * necessarily entirely) analogous to a single file in a file system.
 *
 * The `[id, locale]` tuple should probably be unique for each resource.
 */
export interface Resource<P extends PatternElement = PatternElement> {
  type: 'resource';
  id: string;
  locale: string;
  entries: Record<string, Message<P> | MessageGroup<P>>;
  meta?: Meta;
}

export interface MessageGroup<P extends PatternElement = PatternElement> {
  type: 'group';
  entries: Record<string, Message<P> | MessageGroup<P>>;
  meta?: Meta;
}

/**
 * Additional meta information amy be attached to most nodes. In common use,
 * this information is not required when formatting a message.
 */
export type Meta = Record<string, string>;

export const hasMeta = (part: Record<string, any>): part is { meta: Meta } =>
  !!part.meta &&
  typeof part.meta === 'object' &&
  Object.keys(part.meta).length > 0;

//// MESSAGES ////

/**
 * The core of the spec, the representation of a single message.
 * The shape of the value is an implementation detail, and may vary for the
 * same message in different languages.
 */
export type Message<P extends PatternElement = PatternElement> =
  | PatternMessage<P>
  | SelectMessage<P>;

/**
 * The body of each message is composed of a sequence of parts, some of them
 * fixed (Literal), others placeholders for values depending on additional
 * data.
 */
export interface PatternMessage<P extends PatternElement = PatternElement> {
  type: 'message';
  pattern: P[];
  meta?: Meta;
}

/**
 * Select generalises the plural, selectordinal and select argument types of
 * MessageFormat 1. Each case is defined by a key of one or more string
 * identifiers, and selection between them is made according to the values of
 * a corresponding number of placeholders. The result of the selection is
 * always a single Pattern.
 *
 * It is likely that in nearly all cases the source of the placeholder's value
 * will be a variable in the local scope.
 *
 * If a selection argument does not define an explicit `default` value for
 * itself, the string `'other'` is used.
 */
export interface SelectMessage<P extends PatternElement = PatternElement> {
  type: 'select';
  select: Selector<P>[];
  cases: SelectCase<P>[];
  meta?: Meta;
}

export interface Selector<P extends PatternElement = PatternElement> {
  value: P;
  fallback?: string;
}

export interface SelectCase<P extends PatternElement = PatternElement> {
  key: string[];
  value: PatternMessage<P>;
}

export const isMessage = <P extends PatternElement = PatternElement>(
  msg: Resource<P> | MessageGroup<P> | Message<P> | undefined
): msg is Message<P> =>
  !!msg &&
  typeof msg === 'object' &&
  'type' in msg &&
  (msg.type === 'message' || msg.type === 'select');

export const isSelectMessage = <P extends PatternElement = PatternElement>(
  msg: Message<P>
): msg is SelectMessage<P> => msg.type === 'select';

//// MESSAGE PARTS ////

/**
 * The contents of a message are a sequence of pattern elements, which may be
 * immediately defined literal values, a reference to a value that depends on
 * another message, the value of some runtime variable, or some function
 * defined elsewhere.
 */
export interface PatternElement {
  type: string;
  meta?: Meta;
}
