import * as Fluent from '@fluent/syntax';
import {
  type Model as MF,
  isCatchallKey,
  isLiteral,
  isPatternMessage,
  isSelectMessage
} from 'messageformat';

type MsgContext = {
  declarations: MF.Declaration[];
  functionMap: Record<string, string>;
};

const reIdentifier = /^[a-zA-Z][\w-]*$/;
const reNumberLiteral = /^-?[0-9]+(\.[0-9]+)?$/;

/**
 * Convert a {@link MF.Message | Model.Message} data object into a
 * {@link https://projectfluent.org/fluent.js/syntax/classes/pattern.html | Fluent.Pattern}
 * (i.e. the value of a Fluent message or an attribute).
 *
 * @param options.defaultKey - The Fluent identifier or numeric literal to use for the
 *   default/fallback variant, which is labelled as `*` in MessageFormat 2,
 *   when not explicitly defined in the data.
 *   Defaults to `other`.
 * @param options.functionMap - A mapping of custom MessageFormat 2 → Fluent function names.
 */
export function messageToFluent(
  msg: MF.Message,
  options?: {
    defaultKey?: string;
    functionMap?: Record<string, string>;
  }
): Fluent.Pattern {
  const defaultKey = options?.defaultKey ?? 'other';
  const functionMap = options?.functionMap ?? {};
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
      let baseKeys: (MF.Literal | MF.CatchallKey)[] = [];
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

function findDefaultKey(variants: MF.Variant[], root: string) {
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

function keyToIdentifier(key: MF.Literal | MF.CatchallKey, defKey: string) {
  const kv = isCatchallKey(key) ? key.value || defKey : key.value;
  if (reNumberLiteral.test(kv)) return new Fluent.NumberLiteral(kv);
  if (reIdentifier.test(kv)) return new Fluent.Identifier(kv);
  throw new Error(`Invalid variant key for Fluent: ${kv}`);
}

function keysMatch(
  a: (MF.Literal | MF.CatchallKey)[],
  b: (MF.Literal | MF.CatchallKey)[]
) {
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

function patternToFluent(ctx: MsgContext, pattern: MF.Pattern) {
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
  { name, options }: MF.FunctionRef
): Fluent.InlineExpression {
  const args = new Fluent.CallArguments();
  if (arg) args.positional[0] = arg;
  if (options?.size) {
    args.named = [];
    for (const [name, value] of options) {
      if (name === 'u:dir' || name === 'u:locale') {
        throw new Error(`The option "${name}" is not supported in Fluent`);
      }
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

  let id: string | undefined;
  switch (name) {
    case 'string':
      return args.positional[0];

    case 'integer':
      args.named.unshift(
        new Fluent.NamedArgument(
          new Fluent.Identifier('maximumFractionDigits'),
          new Fluent.NumberLiteral('0')
        )
      );
      id = 'NUMBER';
      break;

    case 'number':
      if (
        args.positional[0] instanceof Fluent.NumberLiteral &&
        args.named.length === 0
      ) {
        return args.positional[0];
      }
      id = 'NUMBER';
      break;

    case 'datetime':
      id = 'DATETIME';
      break;

    case 'date': {
      let hasStyle = false;
      for (const arg of args.named) {
        if (arg.name.id === 'style') {
          arg.name.id = 'dateStyle';
          hasStyle = true;
          break;
        }
      }
      if (!hasStyle) {
        args.named.unshift(
          new Fluent.NamedArgument(
            new Fluent.Identifier('dateStyle'),
            new Fluent.StringLiteral('medium')
          )
        );
      }
      id = 'DATETIME';
      break;
    }

    case 'time': {
      let hasStyle = false;
      for (const arg of args.named) {
        if (arg.name.id === 'style') {
          arg.name.id = 'timeStyle';
          hasStyle = true;
          break;
        }
      }
      if (!hasStyle) {
        args.named.unshift(
          new Fluent.NamedArgument(
            new Fluent.Identifier('timeStyle'),
            new Fluent.StringLiteral('short')
          )
        );
      }
      id = 'DATETIME';
      break;
    }

    case 'currency':
    case 'unit':
      args.named.unshift(
        new Fluent.NamedArgument(
          new Fluent.Identifier('style'),
          new Fluent.StringLiteral(name)
        )
      );
      id = 'NUMBER';
      break;

    case 'fluent:message': {
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
        throw new Error(
          `Options are not allowed for Fluent message references`
        );
      }
      return new Fluent.MessageReference(new Fluent.Identifier(msgId), attr);
    }

    default:
      id = ctx.functionMap[name];
      if (typeof id !== 'string') {
        throw new Error(`No Fluent equivalent found for "${name}" function`);
      }
  }

  return new Fluent.FunctionReference(new Fluent.Identifier(id), args);
}

function literalToFluent({ value }: MF.Literal) {
  return reNumberLiteral.test(value)
    ? new Fluent.NumberLiteral(value)
    : new Fluent.StringLiteral(value);
}

function expressionToFluent(
  ctx: MsgContext,
  { arg, functionRef }: MF.Expression
): Fluent.InlineExpression {
  const fluentArg = arg ? valueToFluent(ctx, arg) : null;
  if (functionRef) return functionRefToFluent(ctx, fluentArg, functionRef);
  if (fluentArg) return fluentArg;
  throw new Error('Invalid empty expression');
}

function valueToFluent(
  ctx: MsgContext,
  val: MF.Literal | MF.VariableRef
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
  { name }: MF.VariableRef
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
