/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  Junk,
  Literal,
  PatternElement,
  Placeholder,
  VariableRef
} from './pattern';

//// MESSAGE GROUPS ////

/**
 * The root of a message structure is a MessageGroup,
 * which may contain messages as well as other message groups.
 */
export interface MessageGroup {
  type: 'group';
  entries: Record<string, Message | MessageGroup>;
  comment?: string;
}

//// MESSAGES ////

/**
 * The representation of a single message.
 * The shape of the value is an implementation detail,
 * and may vary for the same message in different languages.
 */
export type Message = PatternMessage | SelectMessage;

/**
 * The body of each message is composed of a sequence of parts, some of them
 * fixed (Literal), others placeholders for values depending on additional
 * data.
 */
export interface PatternMessage {
  type: 'message';
  declarations: Declaration[];
  pattern: PatternElement[];
  comment?: string;
}

export interface Declaration {
  target: VariableRef | Junk;
  value: Placeholder | Junk;
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
 */
export interface SelectMessage {
  type: 'select';
  declarations: Declaration[];
  selectors: PatternElement[];
  variants: Variant[];
  comment?: string;
}

export interface Variant {
  keys: Array<Literal | CatchallKey>;
  value: PatternMessage;
}

export interface CatchallKey {
  type: '*';
}

export const isMessage = (
  msg: MessageGroup | Message | undefined
): msg is Message =>
  !!msg &&
  typeof msg === 'object' &&
  (msg.type === 'message' || msg.type === 'select');

export const isSelectMessage = (msg: Message): msg is SelectMessage =>
  msg.type === 'select';
