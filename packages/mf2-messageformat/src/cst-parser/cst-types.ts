import type { MessageSyntaxError } from '../errors';

/** @beta */
export type Message = PatternMessage | SelectMessage | JunkMessage;

/** @beta */
export interface PatternMessage {
  type: 'message';
  declarations: Declaration[];
  pattern: Pattern;
  errors: MessageSyntaxError[];
}

/** @beta */
export interface SelectMessage {
  type: 'select';
  declarations: Declaration[];
  match: Syntax<'match'>;
  selectors: Expression[];
  variants: Variant[];
  errors: MessageSyntaxError[];
}

/** @beta */
export interface JunkMessage {
  type: 'junk';
  declarations: Declaration[];
  errors: MessageSyntaxError[];
  source: string;
}

/** @beta */
export interface Declaration {
  start: number;
  end: number;
  let: Syntax<'let'>;
  target: VariableRef | Junk;
  equals: Syntax<'=' | ''>;
  value: Expression | Junk;
}

/** @beta */
export interface Variant {
  start: number;
  end: number;
  when: Syntax<'when'>;
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
  /** position of the `{` */
  start: number;
  /** position one past the `}` */
  end: number;
  body: Array<Text | Expression>;
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
  body: Literal | VariableRef | FunctionRef | Reserved | Junk;
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
export interface Reserved {
  type: 'reserved';
  sigil: '!' | '@' | '#' | '%' | '^' | '&' | '*' | '<' | '>' | '?' | '~';
  operand: Literal | VariableRef | undefined;
  source: string;
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
