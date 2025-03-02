import type * as CST from '../cst/types.ts';
import { cst } from './from-cst.ts';

/**
 * A node in a message data model
 *
 * @beta
 */
export type MessageNode =
  | Declaration
  | Variant
  | CatchallKey
  | Expression
  | Literal
  | VariableRef
  | FunctionRef
  | Markup;

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
  [cst]?: CST.SimpleMessage | CST.ComplexMessage;
}

/**
 * A message may declare any number of input and local variables,
 * each with a value defined by an expression.
 * The variable name for each declaration must be unique.
 *
 * @beta
 */
export type Declaration = InputDeclaration | LocalDeclaration;

/** @beta */
export interface InputDeclaration {
  type: 'input';
  name: string;
  value: Expression<VariableRef>;
  [cst]?: CST.Declaration;
}

/** @beta */
export interface LocalDeclaration {
  type: 'local';
  name: string;
  value: Expression;
  [cst]?: CST.Declaration;
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
  selectors: VariableRef[];
  variants: Variant[];
  comment?: string;
  [cst]?: CST.SelectMessage;
}

/** @beta */
export interface Variant {
  type?: never;
  keys: Array<Literal | CatchallKey>;
  value: Pattern;
  [cst]?: CST.Variant;
}

/**
 * The catch-all key matches all values.
 *
 * @beta
 */
export interface CatchallKey {
  type: '*';
  value?: string;
  [cst]?: CST.CatchallKey;
}

/**
 * The body of each message is composed of a sequence of parts, some of them
 * fixed (Text), others placeholders for values depending on additional
 * data.
 *
 * @beta
 */
export type Pattern = Array<string | Expression | Markup>;

/**
 * Expressions are used in declarations, as selectors, and as placeholders.
 * Each must include at least an `arg` or a `functionRef`, or both.
 *
 * @beta
 */
export type Expression<
  A extends Literal | VariableRef | undefined =
    | Literal
    | VariableRef
    | undefined
> = {
  type: 'expression';
  attributes?: Attributes;
  [cst]?: CST.Expression;
} & (A extends Literal | VariableRef
  ? { arg: A; functionRef?: FunctionRef }
  : { arg?: never; functionRef: FunctionRef });

/**
 * An immediately defined value.
 *
 * @remarks
 * Always contains a string value. In Function arguments and options,
 * the expeted type of the value may result in the value being
 * further parsed as a boolean or a number.
 *
 * @beta
 */
export interface Literal {
  type: 'literal';
  value: string;
  [cst]?: CST.Literal;
}

/**
 * The value of a VariableRef is defined by the current Scope.
 *
 * @remarks
 * To refer to an inner property of an object value, use `.` as a separator;
 * in case of conflict, the longest starting substring wins.
 * For example, `'user.name'` would be first matched by an exactly matching top-level key,
 * and in case that fails, with the `'name'` property of the `'user'` object:
 * The runtime scopes `{ 'user.name': 'Kat' }` and `{ user: { name: 'Kat' } }`
 * would both resolve a `'user.name'` VariableRef as the string `'Kat'`.
 *
 * @beta
 */
export interface VariableRef {
  type: 'variable';
  name: string;
  [cst]?: CST.VariableRef;
}

/**
 * To resolve a FunctionRef, an externally defined function is called.
 *
 * @remarks
 * The `name` identifies a function that takes in the arguments `args`, the
 * current locale, as well as any `options`, and returns some corresponding
 * output. Likely functions available by default would include `'plural'` for
 * determining the plural category of a numeric value, as well as `'number'`
 * and `'date'` for formatting values.
 *
 * @beta
 */
export interface FunctionRef {
  type: 'function';
  name: string;
  options?: Options;
  [cst]?: CST.FunctionRef;
}

/**
 * Markup placeholders can span ranges of other pattern elements,
 * or represent other inline elements.
 *
 * @remarks
 * The `name` identifies the markup part,
 * which will be included in the result along with any `options`.
 *
 * When formatted to string, all markup will format as an empty string.
 * To use markup, format to parts and post-process the formatted results.
 *
 * @beta
 */
export interface Markup {
  type: 'markup';
  kind: 'open' | 'standalone' | 'close';
  name: string;
  options?: Options;
  attributes?: Attributes;
  [cst]?: CST.Expression;
}

/**
 * The options of {@link FunctionRef} and {@link Markup}.
 *
 * @beta
 */
export type Options = Map<string, Literal | VariableRef>;

/**
 * The attributes of {@link Expression} and {@link Markup}.
 *
 * @beta
 */
export type Attributes = Map<string, true | Literal>;
