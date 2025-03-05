import type { MessageSyntaxError } from '../errors.ts';

export type Message = SimpleMessage | ComplexMessage | SelectMessage;

export interface SimpleMessage {
  type: 'simple';
  declarations?: never;
  pattern: Pattern;
  errors: MessageSyntaxError[];
}

export interface ComplexMessage {
  type: 'complex';
  declarations: Declaration[];
  pattern: Pattern;
  errors: MessageSyntaxError[];
}

export interface SelectMessage {
  type: 'select';
  declarations: Declaration[];
  match: Syntax<'.match'>;
  selectors: VariableRef[];
  variants: Variant[];
  errors: MessageSyntaxError[];
}

export type Declaration = InputDeclaration | LocalDeclaration | Junk;

export interface InputDeclaration {
  type: 'input';
  start: number;
  end: number;
  keyword: Syntax<'.input'>;
  value: Expression | Junk;
}

export interface LocalDeclaration {
  type: 'local';
  start: number;
  end: number;
  keyword: Syntax<'.local'>;
  target: VariableRef | Junk;
  equals?: Syntax<'='>;
  value: Expression | Junk;
}

export interface Variant {
  start: number;
  end: number;
  keys: Array<Literal | CatchallKey>;
  value: Pattern;
}

export interface CatchallKey {
  type: '*';
  /** position of the `*` */
  start: number;
  end: number;
}

export interface Pattern {
  start: number;
  end: number;
  body: Array<Text | Expression>;
  braces?: [Syntax<'{{'>] | [Syntax<'{{'>, Syntax<'}}'>];
}

export interface Text {
  type: 'text';
  start: number;
  end: number;
  value: string;
}

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

export interface Junk {
  type: 'junk';
  start: number;
  end: number;
  source: string;
  name?: never;
}

export interface Literal {
  type: 'literal';
  quoted: boolean;
  start: number;
  end: number;
  open?: Syntax<'|'>;
  value: string;
  close?: Syntax<'|'>;
}

export interface VariableRef {
  type: 'variable';
  start: number;
  end: number;
  open: Syntax<'$'>;
  name: string;
}

export interface FunctionRef {
  type: 'function';
  start: number;
  end: number;
  open: Syntax<':'>;
  name: Identifier;
  options: Option[];
}

export interface Markup {
  type: 'markup';
  start: number;
  end: number;
  open: Syntax<'#' | '/'>;
  name: Identifier;
  options: Option[];
  close?: Syntax<'/'>;
}

export interface Option {
  /** position at the start of the name */
  start: number;
  end: number;
  name: Identifier;
  equals?: Syntax<'='>;
  value: Literal | VariableRef;
}

export interface Attribute {
  /** position at the start of the name */
  start: number;
  end: number;
  open: Syntax<'@'>;
  name: Identifier;
  equals?: Syntax<'='>;
  value?: Literal;
}

export type Identifier =
  | [name: Syntax<string>]
  | [namespace: Syntax<string>, separator: Syntax<':'>]
  | [namespace: Syntax<string>, separator: Syntax<':'>, name: Syntax<string>];

export interface Syntax<T extends string> {
  start: number;
  end: number;
  value: T;
}
