import * as Fluent from '@fluent/syntax';
import {
  CatchallKey,
  Declaration,
  Expression,
  FunctionRef,
  Literal,
  Message,
  Pattern,
  VariableRef,
  Variant,
  isCatchallKey,
  isLiteral,
  isPatternMessage,
  isSelectMessage
} from 'messageformat';

/**
 * Symbol used to identify a custom function for Fluent message/term references.
 */
export const FluentMessageRef = Symbol.for('Fluent message ref');

type MsgContext = {
  declarations: Declaration[];
  functionMap: FunctionMap;
};

export type FunctionMap = Record<string, string | symbol | null>;

/**
 * Default value for the {@link messageToFluent} `functionMap` option.
 */
export const defaultFunctionMap: FunctionMap = {
  datetime: 'DATETIME',
  'fluent:message': FluentMessageRef,
  number: 'NUMBER',
  plural: 'NUMBER',
  string: null
};

const isIdentifier = (value: string) => /^[a-zA-Z][\w-]*$/.test(value);

const isNumberLiteral = (value: string) => /^-?[0-9]+(\.[0-9]+)?$/.test(value);

/**
 * Convert a {@link messageformat#Message} data object into a
 * {@link https://projectfluent.org/fluent.js/syntax/classes/pattern.html | Fluent.Pattern}
 * (i.e. the value of a Fluent message or an attribute).
 *
 * @param defaultKey - The Fluent identifier or numeric literal to use for the
 *   default/fallback variant, which is labelled as `*` in MessageFormat 2,
 *   when not explicitly defined in the data.
 * @param functionMap - A mapping of MessageFormat 2 → Fluent function names.
 *   The special value {@link FluentMessageRef} maps to Fluent message/term references.
 */
export function messageToFluent(
  msg: Message,
  defaultKey = 'other',
  functionMap = defaultFunctionMap
): Fluent.Pattern {
  const ctx: MsgContext = {
    declarations: msg.declarations,
    functionMap
  };
  if (isPatternMessage(msg)) {
    return patternToFluent(ctx, msg.pattern);
  }

  if (isSelectMessage(msg)) {
    const defKey = findDefaultKey(msg.variants, defaultKey);
    const variants = msg.variants.map(({ keys, value }) => ({
      keys: keys.slice(), // will be modified
      pattern: patternToFluent(ctx, value)
    }));
    const k0 = variants[0].keys;
    while (k0.length > 0) {
      const sel = variableRefToFluent(ctx, msg.selectors[k0.length - 1]);
      let baseKeys: (Literal | CatchallKey)[] = [];
      let exp: Fluent.SelectExpression | undefined;
      for (let i = 0; i < variants.length; ++i) {
        const { keys, pattern } = variants[i];
        const key = keys.pop();
        if (!key) throw new Error('Mismatch in selector key counts');
        const variant = new Fluent.Variant(
          keyToIdentifier(key, defKey),
          pattern,
          isCatchallKey(key)
        );
        if (exp && keysMatch(baseKeys, keys)) {
          exp.variants.push(variant);
          variants.splice(i, 1);
          i -= 1;
        } else {
          baseKeys = keys;
          exp = new Fluent.SelectExpression(sel.clone(), [variant]);
          variants[i].pattern = new Fluent.Pattern([new Fluent.Placeable(exp)]);
        }
      }
    }
    if (variants.length !== 1) {
      throw new Error(
        `Error resolving select message variants (n=${variants.length})`
      );
    }

    return variants[0].pattern;
  }

  throw new Error('Unsupported message type');
}

function findDefaultKey(variants: Variant[], root: string) {
  let i = 0;
  let defKey = root;
  while (
    variants.some(v =>
      v.keys.some(key => key.type !== '*' && key.value === defKey)
    )
  ) {
    i += 1;
    defKey = `${root}${i}`;
  }
  return defKey;
}

function keyToIdentifier(key: Literal | CatchallKey, defKey: string) {
  const kv = isCatchallKey(key) ? key.value || defKey : key.value;
  if (isNumberLiteral(kv)) return new Fluent.NumberLiteral(kv);
  if (isIdentifier(kv)) return new Fluent.Identifier(kv);
  throw new Error(`Invalid variant key for Fluent: ${kv}`);
}

function keysMatch(a: (Literal | CatchallKey)[], b: (Literal | CatchallKey)[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    const aa = a[i];
    const bb = b[i];
    if (aa.type === '*') {
      if (bb.type !== '*') return false;
    } else {
      if (bb.type === '*' || aa.value !== bb.value) return false;
    }
  }
  return true;
}

function patternToFluent(ctx: MsgContext, pattern: Pattern) {
  const elements = pattern.map(el => {
    if (typeof el === 'string') return new Fluent.TextElement(el);
    if (el.type === 'expression') {
      return new Fluent.Placeable(expressionToFluent(ctx, el));
    }
    throw new Error(`Conversion of ${el.type} to Fluent is not supported`);
  });
  return new Fluent.Pattern(elements);
}

function functionRefToFluent(
  ctx: MsgContext,
  arg: Fluent.InlineExpression | null,
  { name, options }: FunctionRef
): Fluent.InlineExpression {
  const args = new Fluent.CallArguments();
  if (arg) args.positional[0] = arg;
  if (options?.size) {
    args.named = [];
    for (const [name, value] of options) {
      const va = valueToFluent(ctx, value);
      if (va instanceof Fluent.BaseLiteral) {
        const id = new Fluent.Identifier(name);
        args.named.push(new Fluent.NamedArgument(id, va));
      } else {
        throw new Error(
          `Fluent options must have literal values (got ${va.type} for ${name})`
        );
      }
    }
  }

  const id = ctx.functionMap[name];
  if (id === null) {
    if (args.named.length > 0) {
      throw new Error(
        `The function :${name} is dropped in Fluent, so cannot have options.`
      );
    }
    return args.positional[0];
  }
  if (
    id === 'NUMBER' &&
    args.positional[0] instanceof Fluent.NumberLiteral &&
    args.named.length === 0
  ) {
    return args.positional[0];
  }
  if (typeof id === 'string') {
    return new Fluent.FunctionReference(new Fluent.Identifier(id), args);
  }

  if (
    (name === 'currency' || name === 'unit') &&
    typeof ctx.functionMap.number === 'string'
  ) {
    args.named.unshift(
      new Fluent.NamedArgument(
        new Fluent.Identifier('style'),
        new Fluent.StringLiteral(name)
      )
    );
    return new Fluent.FunctionReference(
      new Fluent.Identifier(ctx.functionMap.number),
      args
    );
  }

  if (id === FluentMessageRef) {
    const lit = args.positional[0];
    if (!(lit instanceof Fluent.BaseLiteral)) {
      throw new Error(
        `Fluent message and term references must have a literal message identifier`
      );
    }
    const { msgId, msgAttr } = valueToMessageRef(lit.value);
    const attr = msgAttr ? new Fluent.Identifier(msgAttr) : null;

    if (msgId[0] === '-') {
      args.positional = [];
      return new Fluent.TermReference(
        new Fluent.Identifier(msgId.substring(1)),
        attr,
        args.named.length > 0 ? args : null
      );
    }

    if (args.named.length > 0) {
      throw new Error(`Options are not allowed for Fluent message references`);
    }
    return new Fluent.MessageReference(new Fluent.Identifier(msgId), attr);
  }

  throw new Error(`No Fluent equivalent found for "${name}" function`);
}

function literalToFluent({ value }: Literal) {
  return isNumberLiteral(value)
    ? new Fluent.NumberLiteral(value)
    : new Fluent.StringLiteral(value);
}

function expressionToFluent(
  ctx: MsgContext,
  { arg, functionRef }: Expression
): Fluent.InlineExpression {
  const fluentArg = arg ? valueToFluent(ctx, arg) : null;
  if (functionRef) return functionRefToFluent(ctx, fluentArg, functionRef);
  if (fluentArg) return fluentArg;
  throw new Error('Invalid empty expression');
}

function valueToFluent(
  ctx: MsgContext,
  val: Literal | VariableRef
): Fluent.InlineExpression {
  return isLiteral(val) ? literalToFluent(val) : variableRefToFluent(ctx, val);
}

export function valueToMessageRef(value: string): {
  msgId: string;
  msgAttr: string | null;
} {
  const match = value.match(/^(-?[a-zA-Z][\w-]*)(?:\.([a-zA-Z][\w-]*))?$/);
  if (!match) throw new Error(`Invalid message identifier: ${value}`);
  return { msgId: match[1], msgAttr: match[2] ?? null };
}

function variableRefToFluent(
  ctx: MsgContext,
  { name }: VariableRef
): Fluent.InlineExpression {
  const local = ctx.declarations.find(decl => decl.name === name);
  if (local?.value) {
    const idx = ctx.declarations.indexOf(local);
    return expressionToFluent(
      { ...ctx, declarations: ctx.declarations.slice(0, idx) },
      local.value
    );
  }
  return new Fluent.VariableReference(new Fluent.Identifier(name));
}
