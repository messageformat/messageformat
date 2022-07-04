/* eslint-disable @typescript-eslint/no-explicit-any */

//// MESSAGE GROUPS ////

/**
 * The root of a message structure is a MessageGroup,
 * which may contain messages as well as other message groups.
 */
export interface MessageGroup<P extends PatternElement = PatternElement> {
  type: 'group';
  entries: Record<string, Message<P> | MessageGroup<P>>;
  comment?: string;
}

//// MESSAGES ////

/**
 * The representation of a single message.
 * The shape of the value is an implementation detail,
 * and may vary for the same message in different languages.
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
  comment?: string;
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
  match: Selector<P>[];
  variants: Variant<P>[];
  comment?: string;
}

export interface Selector<P extends PatternElement = PatternElement> {
  value: P;
  fallback?: string;
}

export interface Variant<P extends PatternElement = PatternElement> {
  key: string[];
  value: PatternMessage<P>;
}

export const isMessage = <P extends PatternElement = PatternElement>(
  msg: MessageGroup<P> | Message<P> | undefined
): msg is Message<P> =>
  !!msg &&
  typeof msg === 'object' &&
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
}
