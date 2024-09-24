import type { MessageSyntaxError } from '../errors.js';

/** @beta */
export type Message = SimpleMessage | ComplexMessage | SelectMessage;

/** @beta */
export interface SimpleMessage {
  type: 'simple';
  declarations?: never;
  pattern: Pattern;
  errors: MessageSyntaxError[];
}

/** @beta */
export interface ComplexMessage {
  type: 'complex';
  declarations: Declaration[];
  pattern: Pattern;
  errors: MessageSyntaxError[];
}

/** @beta */
export interface SelectMessage {
  type: 'select';
  declarations: Declaration[];
  match: Syntax<'.match'>;
  selectors: VariableRef[];
  variants: Variant[];
  errors: MessageSyntaxError[];
}

/** @beta */
export type Declaration = InputDeclaration | LocalDeclaration | Junk;

/** @beta */
export interface InputDeclaration {
  type: 'input';
  start: number;
  end: number;
  keyword: Syntax<'.input'>;
  value: Expression | Junk;
}

/** @beta */
export interface LocalDeclaration {
  type: 'local';
  start: number;
  end: number;
  keyword: Syntax<'.local'>;
  target: VariableRef | Junk;
  equals?: Syntax<'='>;
  value: Expression | Junk;
}

/** @beta */
export interface Variant {
  start: number;
  end: number;
  keys: Array<Literal | CatchallKey>;
  value: Pattern;
}

/** @beta */
export interface CatchallKey {
  type: '*';
  /** position of the `*` */
  start: number;
  end: number;
}

/** @beta */
export interface Pattern {
  start: number;
  end: number;
  body: Array<Text | Expression>;
  braces?: [Syntax<'{{'>] | [Syntax<'{{'>, Syntax<'}}'>];
}

/** @beta */
export interface Text {
  type: 'text';
  start: number;
  end: number;
  value: string;
}

/** @beta */
export interface Expression {
  type: 'expression';
  start: number;
  end: number;
  braces: [Syntax<'{'>] | [Syntax<'{'>, Syntax<'}'>];
  arg?: Literal | VariableRef;
  functionRef?: FunctionRef | Junk;
  markup?: Markup;
  attributes: Attribute[];
}

/** @beta */
export interface Junk {
  type: 'junk';
  start: number;
  end: number;
  source: string;
  name?: never;
}

/** @beta */
export interface Literal {
  type: 'literal';
  quoted: boolean;
  start: number;
  end: number;
  open?: Syntax<'|'>;
  value: string;
  close?: Syntax<'|'>;
}

/** @beta */
export interface VariableRef {
  type: 'variable';
  start: number;
  end: number;
  open: Syntax<'$'>;
  name: string;
}

/** @beta */
export interface FunctionRef {
  type: 'function';
  start: number;
  end: number;
  open: Syntax<':'>;
  name: Identifier;
  options: Option[];
}

/** @beta */
export interface Markup {
  type: 'markup';
  start: number;
  end: number;
  open: Syntax<'#' | '/'>;
  name: Identifier;
  options: Option[];
  close?: Syntax<'/'>;
}

/** @beta */
export interface Option {
  /** position at the start of the name */
  start: number;
  end: number;
  name: Identifier;
  equals?: Syntax<'='>;
  value: Literal | VariableRef;
}

/** @beta */
export interface Attribute {
  /** position at the start of the name */
  start: number;
  end: number;
  open: Syntax<'@'>;
  name: Identifier;
  equals?: Syntax<'='>;
  value?: Literal;
}

/** @beta */
export type Identifier =
  | [name: Syntax<string>]
  | [namespace: Syntax<string>, separator: Syntax<':'>]
  | [namespace: Syntax<string>, separator: Syntax<':'>, name: Syntax<string>];

/** @beta */
export interface Syntax<T extends string> {
  start: number;
  end: number;
  value: T;
}
