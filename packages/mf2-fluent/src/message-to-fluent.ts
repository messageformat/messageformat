import * as Fluent from '@fluent/syntax';
import {
  CatchallKey,
  Declaration,
  Expression,
  isCatchallKey,
  isLiteral,
  isPatternMessage,
  isPlaceholder,
  isSelectMessage,
  isText,
  isVariableRef,
  Literal,
  Message,
  Pattern,
  PatternElement,
  VariableRef,
  Variant
} from 'messageformat';

export const FluentMessageRef = Symbol.for('Fluent message ref');

type MsgContext = {
  declarations: Declaration[];
  functionMap: FunctionMap;
};

export type FunctionMap = Record<string, string | symbol>;

export const defaultFunctionMap: FunctionMap = {
  DATETIME: 'DATETIME',
  MESSAGE: FluentMessageRef,
  NUMBER: 'NUMBER'
};

const isIdentifier = (value: string) => /^[a-zA-Z][\w-]*$/.test(value);

const isNumberLiteral = (value: string) => /^-?[0-9]+(\.[0-9]+)?$/.test(value);

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
      const sel = placeholderToFluent(ctx, msg.selectors[k0.length - 1]);
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

  throw new Error('Cannot convert junk message to Fluent');
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
  const kv = isCatchallKey(key) ? defKey : key.value;
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
  const elements = pattern.body.map(el =>
    isText(el)
      ? new Fluent.TextElement(el.value)
      : new Fluent.Placeable(placeholderToFluent(ctx, el))
  );
  return new Fluent.Pattern(elements);
}

function expressionToFluent(
  ctx: MsgContext,
  { name, operand, options }: Expression
): Fluent.InlineExpression {
  const args = new Fluent.CallArguments();
  if (operand) args.positional[0] = valueToFluent(ctx, operand);
  if (options) {
    args.named = options.map(opt => {
      const va = valueToFluent(ctx, opt.value);
      if (va instanceof Fluent.BaseLiteral) {
        const id = new Fluent.Identifier(opt.name);
        return new Fluent.NamedArgument(id, va);
      }
      throw new Error(
        `Fluent options must have literal values (got ${va.type} for ${opt.name})`
      );
    });
  }

  const id = ctx.functionMap[name];
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

  if (id === FluentMessageRef) {
    if (!isLiteral(operand)) {
      throw new Error(
        `Fluent message and term references must have a literal message identifier`
      );
    }
    const { msgId, msgAttr } = valueToMessageRef(operand.value);
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

function placeholderToFluent(
  ctx: MsgContext,
  ph: PatternElement
): Fluent.InlineExpression {
  const body = isPlaceholder(ph) ? ph.body : ph;
  switch (body.type) {
    case 'expression':
      return expressionToFluent(ctx, body);
    case 'literal':
      return new Fluent.StringLiteral(body.value);
    case 'variable':
      return variableRefToFluent(ctx, body);
    default:
      throw new Error(
        `Conversion of "${body.type}" placeholder to Fluent is not supported`
      );
  }
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
  const local = ctx.declarations.find(
    decl => isVariableRef(decl.target) && decl.target.name === name
  );
  return local
    ? placeholderToFluent(ctx, local.value)
    : new Fluent.VariableReference(new Fluent.Identifier(name));
}
