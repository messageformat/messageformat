import type { ParseError } from './parser/data-model';
import type {
  Junk,
  Literal,
  PatternElement,
  Placeholder,
  VariableRef
} from './pattern';

/**
 * The representation of a single message.
 * The shape of the value is an implementation detail,
 * and may vary for the same message in different languages.
 */
export type Message = PatternMessage | SelectMessage | JunkMessage;

/**
 * The body of each message is composed of a sequence of parts, some of them
 * fixed (Literal), others placeholders for values depending on additional
 * data.
 */
export interface PatternMessage {
  type: 'message';
  declarations: Declaration[];
  pattern: Pattern;
  comment?: string;
  errors?: ParseError[];
}

export interface Declaration {
  target: VariableRef | Junk;
  value: Placeholder | Junk;
}

export interface Pattern {
  body: PatternElement[];
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
  errors?: ParseError[];
}

export interface Variant {
  keys: Array<Literal | CatchallKey>;
  value: Pattern;
}

export interface CatchallKey {
  type: '*';
}

export interface JunkMessage {
  type: 'junk';
  declarations: Declaration[];
  source: string;
  comment?: string;
  errors?: ParseError[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMessage = (msg: any): msg is Message =>
  !!msg &&
  typeof msg === 'object' &&
  (msg.type === 'message' || msg.type === 'select');

export const isSelectMessage = (msg: Message): msg is SelectMessage =>
  msg.type === 'select';
