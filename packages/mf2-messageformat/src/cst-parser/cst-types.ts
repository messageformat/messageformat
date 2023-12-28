import type { MessageSyntaxError } from '../errors';

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
  selectors: Expression[];
  variants: Variant[];
  errors: MessageSyntaxError[];
}

/** @beta */
export type Declaration =
  | InputDeclaration
  | LocalDeclaration
  | ReservedStatement;

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
  equals: Syntax<'=' | ''>;
  value: Expression | Junk;
}

/** @beta */
export interface ReservedStatement {
  type: 'reserved-statement';
  start: number;
  end: number;
  keyword: Syntax<string>;
  body: Syntax<string>;
  values: Expression[];
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
  quotes?: [Syntax<'{{'>] | [Syntax<'{{'>, Syntax<'}}'>];
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
  /** position of the `{` */
  start: number;
  /** position one past the `}` */
  end: number;
  body: Literal | VariableRef | FunctionRef | ReservedAnnotation | Junk;
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
  /** position of the initial `|` */
  start: number;
  /** position one past the terminal `|` */
  end: number;
  value: string;
}

/** @beta */
export interface VariableRef {
  type: 'variable';
  /** position of the `$` */
  start: number;
  end: number;
  name: string;
}

/** @beta */
export interface FunctionRef {
  type: 'function';
  kind: 'open' | 'close' | 'value';
  operand: Literal | VariableRef | undefined;
  /** position of the `:`/`+`/`-`, so `operand.start` may be earlier */
  start: number;
  end: number;
  name: string;
  options: Option[];
}

/** @beta */
export interface ReservedAnnotation {
  type: 'reserved-annotation';
  sigil: '!' | '@' | '#' | '%' | '^' | '&' | '*' | '<' | '>' | '?' | '~';
  operand: Literal | VariableRef | undefined;
  source: Syntax<string>;
  /** position of the sigil, so `operand.start` may be earlier */
  start: number;
  end: number;
}

/** @beta */
export interface Option {
  /** position at the start of the name */
  start: number;
  end: number;
  name: string;
  value: Literal | VariableRef;
}

/** @beta */
export interface Syntax<T extends string> {
  start: number;
  end: number;
  value: T;
}
