/** A node in a message data model */
export type MessageNode =
  | Declaration
  | Variant
  | CatchallKey
  | Expression
  | Literal
  | VariableRef
  | FunctionAnnotation
  | UnsupportedAnnotation
  | Markup
  | Option;

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
  type?: never;
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
 * Expressions are used in declarations, as selectors, and as placeholders.
 * Each must include at least an `arg` or an `annotation`, or both.
 *
 * @beta
 */
export type Expression<
  A extends Literal | VariableRef | undefined =
    | Literal
    | VariableRef
    | undefined
> = A extends Literal | VariableRef
  ? {
      type: 'expression';
      arg: A;
      annotation?: FunctionAnnotation | UnsupportedAnnotation;
    }
  : {
      type: 'expression';
      arg?: never;
      annotation: FunctionAnnotation | UnsupportedAnnotation;
    };

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
}

/**
 * To resolve a FunctionAnnotation, an externally defined function is called.
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
export interface FunctionAnnotation {
  type: 'function';
  name: string;
  options?: Option[];
}

/**
 * When the parser encounters an expression with reserved syntax,
 * it emits an UnsupportedAnnotation to represent it.
 *
 * @remarks
 * As the meaning of this syntax is not supported,
 * it will always resolve with a fallback representation and emit an error.
 *
 * @beta
 */
export interface UnsupportedAnnotation {
  type: 'unsupported-annotation';
  sigil: '!' | '@' | '#' | '%' | '^' | '&' | '*' | '<' | '>' | '?' | '~' | '�';
  source: string;
  name?: never;
  options?: never;
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
export type Markup = MarkupOpen | MarkupStandalone | MarkupClose;

export interface MarkupOpen {
  type: 'markup';
  kind: 'open';
  name: string;
  options?: Option[];
}

export interface MarkupStandalone {
  type: 'markup';
  kind: 'standalone';
  name: string;
  options?: Option[];
}

export interface MarkupClose {
  type: 'markup';
  kind: 'close';
  name: string;
  options?: never;
}

/**
 * The options of {@link FunctionAnnotation} and {@link Markup}
 * are expressed as `key`/`value` pairs to allow their order to be maintained.
 *
 * @beta
 */
export interface Option {
  type?: never;
  name: string;
  value: Literal | VariableRef;
}
