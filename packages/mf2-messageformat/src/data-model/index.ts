import type { Expression, Literal, VariableRef } from './expression/index.js';
import type { Markup } from './markup.js';

export type {
  FunctionAnnotation,
  Option,
  UnsupportedAnnotation
} from './expression/index.js';
export type { MarkupClose, MarkupOpen, MarkupStandalone } from './markup.js';
export { isMarkup } from './markup.js';
export type { Expression, Literal, Markup, VariableRef };

/**
 * The representation of a single message.
 * The shape of the message is an implementation detail,
 * and may vary for the same message in different languages.
 *
 * @beta
 */
export type Message = PatternMessage | SelectMessage;

/**
 * A single message with no variants.
 *
 * @beta
 */
export interface PatternMessage {
  type: 'message';
  declarations: Declaration[];
  pattern: Pattern;
  comment?: string;
}

/**
 * A message may declare any number of input and local variables,
 * each with a value defined by an expression.
 * The variable name for each declaration must be unique.
 *
 * @beta
 */
export type Declaration =
  | InputDeclaration
  | LocalDeclaration
  | UnsupportedStatement;

export interface InputDeclaration {
  type: 'input';
  name: string;
  value: Expression<VariableRef>;
}

export interface LocalDeclaration {
  type: 'local';
  name: string;
  value: Expression;
}

export interface UnsupportedStatement {
  type: 'unsupported-statement';
  keyword: string;
  name?: never;
  value?: never;
  body?: string;
  expressions: (Expression | Markup)[];
}

/**
 * The body of each message is composed of a sequence of parts, some of them
 * fixed (Text), others placeholders for values depending on additional
 * data.
 *
 * @beta
 */
export interface Pattern {
  body: Array<string | Expression | Markup>;
}

/**
 * SelectMessage generalises the plural, selectordinal and select
 * argument types of MessageFormat 1.
 * Each case is defined by a key of one or more string identifiers,
 * and selection between them is made according to
 * the values of a corresponding number of expressions.
 * Selection iterates among the `variants` in order,
 * and terminates when all of the Variant keys match.
 * The result of the selection is always a single Pattern.
 *
 * @beta
 */
export interface SelectMessage {
  type: 'select';
  declarations: Declaration[];
  selectors: Expression[];
  variants: Variant[];
  comment?: string;
}

/** @beta */
export interface Variant {
  keys: Array<Literal | CatchallKey>;
  value: Pattern;
}

/**
 * The catch-all key matches all values.
 *
 * @beta
 */
export interface CatchallKey {
  type: '*';
  value?: string;
}

/**
 * A type guard for {@link CatchallKey} values
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCatchallKey = (key: any): key is CatchallKey =>
  !!key && typeof key === 'object' && key.type === '*';

/**
 * A type guard for {@link Message} values
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMessage = (msg: any): msg is Message =>
  !!msg &&
  typeof msg === 'object' &&
  (msg.type === 'message' || msg.type === 'select');

/**
 * A type guard for {@link PatternMessage} values
 *
 * @beta
 */
export const isPatternMessage = (msg: Message): msg is PatternMessage =>
  msg.type === 'message';

/**
 * A type guard for {@link SelectMessage} values
 *
 * @beta
 */
export const isSelectMessage = (msg: Message): msg is SelectMessage =>
  msg.type === 'select';
