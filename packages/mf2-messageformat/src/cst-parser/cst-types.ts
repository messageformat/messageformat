import type { MessageSyntaxError } from '../errors';

export type Message = PatternMessage | SelectMessage | JunkMessage;

export interface PatternMessage {
  type: 'message';
  declarations: Declaration[];
  pattern: Pattern;
  errors: MessageSyntaxError[];
}
export interface SelectMessage {
  type: 'select';
  declarations: Declaration[];
  selectors: Expression[];
  variants: Variant[];
  errors: MessageSyntaxError[];
}
export interface JunkMessage {
  type: 'junk';
  declarations: Declaration[];
  errors: MessageSyntaxError[];
  source: string;
}

export interface Declaration {
  /** position of the `l` in `let` */
  start: number;
  end: number;
  target: VariableRef | Junk;
  value: Expression | Junk;
}

export interface Variant {
  /** position of the `w` in `when` */
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
  /** position of the `{` */
  start: number;
  /** position of the `}` */
  end: number;
  body: Array<Text | Expression>;
}

export interface Text {
  type: 'text';
  start: number;
  end: number;
  value: string;
}

export interface Expression {
  type: 'expression';
  /** position of the `{` */
  start: number;
  /** position just past the `}` */
  end: number;
  body: Literal | VariableRef | FunctionRef | Reserved | Junk;
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
  /** position of the initial `|` */
  start: number;
  /** position just past the terminal `|` */
  end: number;
  value: string;
}

export interface VariableRef {
  type: 'variable';
  /** position of the `$` */
  start: number;
  end: number;
  name: string;
}

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

export interface Reserved {
  type: 'reserved';
  sigil: '!' | '@' | '#' | '%' | '^' | '&' | '*' | '<' | '>' | '?' | '~';
  operand: Literal | VariableRef | undefined;
  source: string;
  /** position of the sigil, so `operand.start` may be earlier */
  start: number;
  end: number;
}

export interface Option {
  /** position at the start of the name */
  start: number;
  end: number;
  name: string;
  value: Literal | VariableRef;
}
