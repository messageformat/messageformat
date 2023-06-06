import type {
  CatchallKey,
  Declaration,
  JunkMessage,
  Pattern,
  PatternMessage,
  SelectMessage,
  Variant
} from '../data-model';
import type { MessageSyntaxError } from '../errors';
import type {
  FunctionRef,
  Junk,
  Literal,
  Option,
  Text,
  VariableRef
} from '../pattern';

export type MessageParsed =
  | PatternMessageParsed
  | SelectMessageParsed
  | JunkMessageParsed;

export interface PatternMessageParsed extends PatternMessage {
  type: 'message';
  declarations: DeclarationParsed[];
  pattern: PatternParsed;
  errors: MessageSyntaxError[];
}
export interface SelectMessageParsed extends SelectMessage {
  type: 'select';
  declarations: DeclarationParsed[];
  selectors: ExpressionParsed[];
  variants: VariantParsed[];
  errors: MessageSyntaxError[];
}
export interface JunkMessageParsed extends JunkMessage {
  type: 'junk';
  declarations: DeclarationParsed[];
  errors: MessageSyntaxError[];
  source: string;
}

export interface DeclarationParsed extends Declaration {
  /** position of the `l` in `let` */
  start: number;
  end: number;
  target: VariableRefParsed | JunkParsed;
  value: ExpressionParsed | JunkParsed;
}

export interface VariantParsed extends Variant {
  /** position of the `w` in `when` */
  start: number;
  end: number;
  keys: Array<LiteralParsed | NmtokenParsed | CatchallKeyParsed>;
  value: PatternParsed;
}

export interface CatchallKeyParsed extends CatchallKey {
  type: '*';
  /** position of the `*` */
  start: number;
  end: number;
}

export interface PatternParsed extends Pattern {
  /** position of the `{` */
  start: number;
  /** position of the `}` */
  end: number;
  body: Array<TextParsed | ExpressionParsed>;
}

export interface TextParsed extends Text {
  type: 'text';
  start: number;
  end: number;
  value: string;
}

export interface ExpressionParsed {
  type: 'expression';
  /** position of the `{` */
  start: number;
  /** position just past the `}` */
  end: number;
  body: LiteralParsed | VariableRefParsed | FunctionRefParsed | JunkParsed;
}

export interface JunkParsed extends Junk {
  type: 'junk';
  start: number;
  end: number;
  source: string;
}

export interface LiteralParsed extends Literal {
  type: 'literal';
  /** position of the initial `|` */
  start: number;
  /** position just past the terminal `|` */
  end: number;
  value: string;
}

export interface VariableRefParsed extends VariableRef {
  type: 'variable';
  /** position of the `$` */
  start: number;
  end: number;
  name: string;
}

export interface FunctionRefParsed extends FunctionRef {
  type: 'function';
  kind: 'open' | 'close' | 'value';
  operand: LiteralParsed | VariableRefParsed | undefined;
  /** position of the `:`/`+`/`-`, so `operand.start` may be earlier */
  start: number;
  end: number;
  name: string;
  options: OptionParsed[];
}

export interface OptionParsed extends Option {
  /** position at the start of the name */
  start: number;
  end: number;
  name: string;
  value: LiteralParsed | NmtokenParsed | VariableRefParsed;
}

export interface NmtokenParsed extends Literal {
  type: 'nmtoken';
  /** position at the start of the value */
  start: number;
  end: number;
  value: string;
}
