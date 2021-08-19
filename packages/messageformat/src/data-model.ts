/* eslint-disable @typescript-eslint/no-explicit-any */

//// RESOURCES ////

/**
 * The root of a message structure is a Resource. It is somewhat (but not
 * necessarily entirely) analogous to a single file in a file system.
 *
 * The `[id, locale]` tuple should probably be unique for each resource.
 */
export interface Resource {
  id: string;
  locale: string;
  entries: Record<string, Message | MessageGroup>;
  meta?: Meta;
}

export interface MessageGroup {
  entries: Record<string, Message | MessageGroup>;
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
export type Message =
  | { type: 'message'; value: Pattern; meta?: Meta }
  | { type: 'select'; value: Select; meta?: Meta };

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
export interface Select {
  select: Selector[];
  cases: SelectCase[];
}

export interface Selector {
  value: Part;
  default?: string;
}

export interface SelectCase {
  key: string[];
  value: Pattern;
  meta?: Meta;
}

/**
 * The body of each message is composed of a sequence of parts, some of them
 * fixed (Literal), others placeholders for values depending on additional
 * data.
 */
export type Pattern = Part[];

export const isMessage = (
  msg: Message | MessageGroup | undefined
): msg is Message =>
  !!msg &&
  typeof msg === 'object' &&
  'type' in msg &&
  (msg.type === 'message' || msg.type === 'select');

export const isSelect = (value: Message['value']): value is Select =>
  !!value && typeof value === 'object' && 'select' in value;

//// MESSAGE PARTS ////

/**
 * A Part is either a literal, immediately defined value, or a reference to a
 * value that depends on another message, the value of some runtime variable,
 * or some function defined elsewhere.
 *
 * Each of the types that may be used as a Part must be (and are) immediately
 * distinguishable from each other.
 */
export type Part = Literal | Variable | Function | Term;

/**
 * An immediately defined value.
 *
 * Always contains a string value. In Function arguments and options as well as
 * Term scopes, the expeted type of the value may result in the value being
 * further parsed as a boolean or a number.
 */
export interface Literal {
  type: 'literal';
  value: string;
  meta?: Meta;
}

/**
 * Variables are defined by the current Scope.
 *
 * Using an array with more than one value refers to an inner property of an
 * object value, so e.g. `['user', 'name']` would require something like
 * `{ name: 'Kat' }` as the value of the `'user'` scope variable.
 */
export interface Variable {
  type: 'variable';
  var_path: Value[];
  meta?: Meta;
}

/**
 * To resolve a Function, an externally defined function is called.
 *
 * The `func` identifies a function that takes in the arguments `args`, the
 * current locale, as well as any `options`, and returns some corresponding
 * output. Likely functions available by default would include `'plural'` for
 * determining the plural category of a numeric value, as well as `'number'`
 * and `'date'` for formatting values.
 */
export interface Function {
  type: 'function';
  func: string;
  args: Value[];
  options?: Options;
  meta?: Meta;
}

/**
 * A Term is a pointer to a Message or a Select.
 *
 * If `res_id` is undefined, the message is sought in the current Resource.
 * If it is set, it identifies the resource for the sought message. It is
 * entirely intentional that this value may not be defined at runtime.
 * `msg_path` is used to locate the Message within the Resource, and it may
 * include Variable values.
 *
 * `scope` overrides values in the current scope when resolving the message.
 */
export interface Term {
  type: 'term';
  res_id?: string;
  msg_path: Value[];
  scope?: Options;
  meta?: Meta;
}

/**
 * Values may be used as Function and Term arguments and options.
 */
export type Value = Literal | Variable;

/**
 * The Function options and Term scope may be defined directly with Literal
 * values, or use Variables. For Literals, the function's signature determines
 * how the string value is parsed.
 */
export type Options = Record<string, Value>;

export const isLiteral = (part: any): part is Literal =>
  !!part && typeof part === 'object' && part.type === 'literal';

export const isVariable = (part: any): part is Variable =>
  !!part && typeof part === 'object' && part.type === 'variable';

export const isFunction = (part: any): part is Function =>
  !!part && typeof part === 'object' && part.type === 'function';

export const isTerm = (part: any): part is Term =>
  !!part && typeof part === 'object' && part.type === 'term';
