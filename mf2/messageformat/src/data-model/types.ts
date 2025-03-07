/**
 * The Model root is always a {@link Model.Message}.
 *
 * ```ts
 * import type { Model } from 'messageformat';
 * ```
 *
 * @module
 * @category Message Data Model
 */

import type * as CST from '../cst/types.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DefaultFunctions, MessageFunction } from '../functions/index.ts';
import { cstKey } from './from-cst.ts';

/**
 * A node in a message data model
 */
export type Node =
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
 */
export type Message = PatternMessage | SelectMessage;

/**
 * A single message with no variants.
 */
export interface PatternMessage {
  type: 'message';
  declarations: Declaration[];
  pattern: Pattern;
  comment?: string;
  /** @private */
  [cstKey]?: CST.SimpleMessage | CST.ComplexMessage;
}

/**
 * A message may declare any number of input and local variables,
 * each with a value defined by an {@link Expression}.
 * The `name` of each declaration must be unique within the {@link Message}.
 */
export type Declaration = InputDeclaration | LocalDeclaration;

export interface InputDeclaration {
  type: 'input';
  name: string;
  value: Expression<VariableRef>;
  /** @private */
  [cstKey]?: CST.Declaration;
}

export interface LocalDeclaration {
  type: 'local';
  name: string;
  value: Expression;
  /** @private */
  [cstKey]?: CST.Declaration;
}

/**
 * SelectMessage generalises the plural, selectordinal and select
 * argument types of MessageFormat 1.
 * Each case is defined by a key of one or more string identifiers,
 * and selection between them is made according to
 * the values of a corresponding number of `selectors`.
 *
 * Pattern Selection picks the best match among the `variants`.
 * The result of the selection is always a single Pattern.
 */
export interface SelectMessage {
  type: 'select';
  declarations: Declaration[];
  selectors: VariableRef[];
  variants: Variant[];
  comment?: string;
  /** @private */
  [cstKey]?: CST.SelectMessage;
}

export interface Variant {
  type?: never;
  keys: Array<Literal | CatchallKey>;
  value: Pattern;
  /** @private */
  [cstKey]?: CST.Variant;
}

/**
 * The catch-all key matches all values.
 */
export interface CatchallKey {
  type: '*';
  value?: string;
  /** @private */
  [cstKey]?: CST.CatchallKey;
}

/**
 * The body of each {@link Message} is composed of a sequence of parts,
 * some of them fixed (Text),
 * others {@link Expression} and {@link Markup} placeholders
 * for values depending on additional data.
 */
export type Pattern = Array<string | Expression | Markup>;

/**
 * Expressions are used in declarations and as placeholders.
 * Each must include at least an `arg` or a `functionRef`, or both.
 */
export type Expression<
  A extends Literal | VariableRef | undefined =
    | Literal
    | VariableRef
    | undefined
> = {
  type: 'expression';
  attributes?: Attributes;
  /** @private */
  [cstKey]?: CST.Expression;
} & (A extends Literal | VariableRef
  ? { arg: A; functionRef?: FunctionRef }
  : { arg?: never; functionRef: FunctionRef });

/**
 * An immediately defined literal value.
 *
 * Always contains a string value.
 * In {@link FunctionRef} arguments and options,
 * the expected type of the value may result in the value being
 * further parsed as a boolean or a number by the function handler.
 */
export interface Literal {
  type: 'literal';
  value: string;
  /** @private */
  [cstKey]?: CST.Literal;
}

/**
 * The value of a VariableRef is defined by a declaration,
 * or by the `msgParams` argument of a {@link MessageFormat.format} or
 * {@link MessageFormat.formatToParts} call.
 */
export interface VariableRef {
  type: 'variable';
  name: string;
  /** @private */
  [cstKey]?: CST.VariableRef;
}

/**
 * To resolve a FunctionRef, a {@link MessageFunction} is called.
 *
 * The `name` identifies one of the {@link DefaultFunctions},
 * or a function included in the {@link MessageFormatOptions.functions}.
 */
export interface FunctionRef {
  type: 'function';
  name: string;
  options?: Options;
  /** @private */
  [cstKey]?: CST.FunctionRef;
}

/**
 * Markup placeholders can span ranges of other pattern elements,
 * or represent other inline elements.
 *
 * The `name` identifies the markup part,
 * which will be included in the result along with any `options`.
 *
 * When formatted to string, all markup will format as an empty string.
 * To use markup, format to parts and post-process the formatted results.
 */
export interface Markup {
  type: 'markup';
  kind: 'open' | 'standalone' | 'close';
  name: string;
  options?: Options;
  attributes?: Attributes;
  /** @private */
  [cstKey]?: CST.Expression;
}

/**
 * The options of {@link FunctionRef} and {@link Markup}.
 */
export type Options = Map<string, Literal | VariableRef>;

/**
 * The attributes of {@link Expression} and {@link Markup}.
 */
export type Attributes = Map<string, true | Literal>;
