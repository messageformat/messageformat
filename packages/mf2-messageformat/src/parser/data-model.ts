export type TokenError =
  | { type: 'empty-token'; start: number; end?: never }
  | {
      type:
        | 'bad-escape'
        | 'bad-selector'
        | 'extra-content'
        | 'key-mismatch'
        | 'parse-error';
      start: number;
      end: number;
    }
  | { type: 'missing-char'; char: string; start: number; end?: never };

export type Message = PatternMessage | SelectMessage | JunkMessage;
export type PatternMessage = {
  type: 'pattern';
  declarations: Declaration[];
  pattern: Pattern;
  errors: TokenError[];
};
export type SelectMessage = {
  type: 'select';
  declarations: Declaration[];
  selectors: Placeholder[];
  variants: Variant[];
  errors: TokenError[];
};
export type JunkMessage = {
  type: 'junk';
  declarations: Declaration[];
  errors: TokenError[];
};

export type Declaration = {
  /** position of the `l` in `let` */
  start: number;
  end: number;
  target: Variable | Junk;
  value: Placeholder | Junk;
};

export type Variant = {
  /** position of the `w` in `when` */
  start: number;
  end: number;
  keys: Array<Literal | Nmtoken | CatchallKey>;
  pattern: Pattern;
};

export type CatchallKey = {
  type: '*';
  /** position of the `*` */
  start: number;
  end: number;
};

export type Pattern = {
  /** position of the `{` */
  start: number;
  /** position of the `}` */
  end: number;
  body: Array<Text | Placeholder>;
};

export type Text = {
  type: 'text';
  start: number;
  end: number;
  value: string;
};

export type Placeholder = {
  type: 'placeholder';
  /** position of the `{` */
  start: number;
  /** position just past the `}` */
  end: number;
  body: Literal | Variable | Expression | Markup | MarkupEnd | Junk;
};

export type Junk = {
  type: 'junk';
  start: number;
  end: number;
};

export type Literal = {
  type: 'literal';
  /** position of the `(` */
  start: number;
  /** position just past the `)` */
  end: number;
  value: string;
};

export type Variable = {
  type: 'variable';
  /** position of the `$` */
  start: number;
  end: number;
  name: string;
};

export type Expression = {
  type: 'expression';
  operand: Literal | Variable | undefined;
  /** position of the `:`, so `operand.start` may be earlier */
  start: number;
  end: number;
  name: string;
  options: Option[];
};

export type Markup = {
  type: 'markup-start';
  /** position of the `+` */
  start: number;
  end: number;
  name: string;
  options: Option[];
};

export type MarkupEnd = {
  type: 'markup-end';
  /** position of the `-` */
  start: number;
  end: number;
  name: string;
};

export type Option = {
  /** position at the start of the name */
  start: number;
  end: number;
  name: string;
  value: Literal | Nmtoken | Variable;
};

export type Nmtoken = {
  type: 'nmtoken';
  /** position at the start of the value */
  start: number;
  end: number;
  value: string;
};
