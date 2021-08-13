import {
  Function,
  isFunction,
  isLiteral,
  isPart,
  isSelect,
  isTerm,
  isVariable,
  LiteralValue,
  Message,
  Meta,
  Part,
  Pattern,
  Select,
  Term,
  Variable
} from './data-model';
import { FormattedSelectMeta, getFormattedSelectMeta } from './detect-grammar';
import { Context, extendContext } from './format-context';

export abstract class Formatted<T> {
  abstract type: 'dynamic' | 'fallback' | 'literal' | 'message';
  value: T;
  declare meta?: Record<string, boolean | number | string | null>;

  constructor(value: T, meta?: Meta) {
    this.value = value;
    if (meta) addMeta(this, meta);
  }

  toString(locales?: string[]) {
    return typeof this.value === 'number' &&
      Array.isArray(locales) &&
      locales.length > 0
      ? this.value.toLocaleString(locales)
      : String(this.value);
  }

  valueOf(): T | string {
    return this.value;
  }
}

export class FormattedDynamic<T = string> extends Formatted<T> {
  type = 'dynamic' as const;
}
export class FormattedFallback extends Formatted<string> {
  type = 'fallback' as const;
  toString() {
    return `{${this.value}}`;
  }
  valueOf() {
    return this.toString();
  }
}
export class FormattedLiteral extends Formatted<LiteralValue> {
  type = 'literal' as const;
}
export class FormattedMessage<T = unknown> extends Formatted<
  Array<FormattedPart<T>>
> {
  type = 'message' as const;
  toString(locales?: string[]) {
    let res = '';
    for (const fp of this.value) res += fp.toString(locales);
    return res;
  }
  valueOf() {
    return this.toString();
  }
}

export type FormattedPart<T = unknown> =
  | FormattedDynamic<T>
  | FormattedFallback
  | FormattedLiteral
  | FormattedMessage<T | LiteralValue>;

function addMeta(fmt: Formatted<unknown>, meta: Meta) {
  if (!fmt.meta) fmt.meta = {};
  for (let [key, value] of Object.entries(meta)) {
    if (typeof value === 'object') {
      if (!value) {
        fmt.meta[key] = null;
        continue;
      } else if (typeof value.valueOf === 'function') {
        // handle instances of Boolean, Number & String
        value = value.valueOf();
      }
    }
    switch (typeof value) {
      case 'boolean':
      case 'number':
      case 'string':
        fmt.meta[key] = value;
    }
  }
}

export function formatToString<R, S>(ctx: Context<R, S>, msg: Message) {
  let res = '';
  for (const fp of formatToParts(ctx, msg)) res += fp.toString(ctx.locales);
  return res;
}

export function formatToParts<R, S>(
  ctx: Context<R, S>,
  { meta, value }: Message
): FormattedPart<R | S>[] {
  let fsm: FormattedSelectMeta | null = null;
  const pattern = isSelect(value)
    ? resolveSelect(ctx, value, _fsm => (fsm = _fsm))
    : value;
  const res = pattern.map(part => resolvePart(ctx, part));
  if (meta || fsm) {
    const fm = new FormattedMessage<R | S | LiteralValue>(res, meta);
    if (fsm) addMeta(fm, fsm);
    return [fm];
  } else return res;
}

function resolvePart<R, S>(
  ctx: Context<R, S>,
  part: Part
):
  | FormattedDynamic<R | S>
  | FormattedFallback
  | FormattedLiteral
  | FormattedMessage<R | S | LiteralValue> {
  if (isLiteral(part)) return new FormattedLiteral(part.value, part.meta);
  if (isVariable(part)) return resolveVariable(ctx, part);
  if (isFunction(part)) return resolveFormatFunction(ctx, part);
  if (isTerm(part)) return resolveMessage(ctx, part);
  /* istanbul ignore next - never happens */
  throw new Error(`Unsupported part: ${part}`);
}

function resolveFormatFunction<R, S>(
  ctx: Context<R, S>,
  fn: Function
): FormattedDynamic<R> | FormattedFallback {
  const { args, func, options } = fn;
  const fnArgs = args.map(arg => resolvePart(ctx, arg).valueOf());
  const rf = ctx.runtime.format[func];
  try {
    const value = rf(ctx.locales, options, ...fnArgs);
    return new FormattedDynamic<R>(value, fn.meta);
  } catch (error) {
    const fb = resolveFallback(ctx, fn);
    addMeta(fb, {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack
    });
    return fb;
  }
}

function resolveMessage<R, S>(
  ctx: Context<R, S>,
  term: Term
): FormattedMessage<R | S | LiteralValue> | FormattedFallback {
  const { msg_path, res_id, scope } = term;
  const strPath = msg_path.map(part => String(resolvePart(ctx, part)));
  const msg = ctx.getMessage(res_id, strPath);
  if (!msg) return resolveFallback(ctx, term);
  if (res_id || scope) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let msgScope: any = undefined;
    if (scope) {
      // Let's not check typings of Term scope overrides
      msgScope = Object.assign({}, ctx.scope);
      for (const [key, value] of Object.entries(scope))
        msgScope[key] = isPart(value)
          ? resolvePart(ctx, value).valueOf()
          : value;
    }
    ctx = extendContext(ctx, res_id, msgScope);
  }
  return new FormattedMessage(formatToParts(ctx, msg), term.meta);
}

export type ResolvedSelector = {
  value: LiteralValue | LiteralValue[];
  default: LiteralValue;
};

function resolveSelect<R, S>(
  ctx: Context<R, S>,
  select: Select,
  onMeta?: (meta: FormattedSelectMeta) => void
): Pattern {
  const res: ResolvedSelector[] = select.select.map(s => {
    const v = isFunction(s.value)
      ? resolveSelectFunction(ctx, s.value)
      : resolvePart(ctx, s.value).valueOf();
    let value: LiteralValue | LiteralValue[];
    if (typeof v === 'number') {
      const { plural } = ctx.runtime.select;
      value =
        typeof plural === 'function' ? plural(ctx.locales, undefined, v) : v;
    } else value = typeof v === 'string' || Array.isArray(v) ? v : String(v);
    return { value, default: s.default || 'other' };
  });

  for (const { key, value } of select.cases) {
    if (
      key.every((k, i) => {
        const r = res[i];
        return (
          k === r.default ||
          k === r.value ||
          (Array.isArray(r.value) && r.value.includes(k))
        );
      })
    ) {
      if (onMeta) {
        const meta = getFormattedSelectMeta(select, res, key);
        if (meta) onMeta(meta);
      }
      return value;
    }
  }
  return [];
}

function resolveSelectFunction<R, S>(
  ctx: Context<R, S>,
  { args, func, options }: Function
) {
  const fnArgs = args.map(arg => resolvePart(ctx, arg).valueOf());
  const fn = ctx.runtime.select[func];
  try {
    return fn(ctx.locales, options, ...fnArgs);
  } catch (_) {
    return isLiteral(fnArgs[0]) ? fnArgs[0] : String(fnArgs[0]);
  }
}

function resolveVariable<R, S>(
  ctx: Context<R, S>,
  part: Variable
): FormattedDynamic<S> | FormattedFallback {
  const { var_path } = part;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = var_path.length > 0 ? ctx.scope : undefined;
  for (const p of var_path) {
    if (!val || typeof val !== 'object') {
      val = undefined;
      break;
    }
    val = val[resolvePart(ctx, p).toString()];
  }
  return val === undefined
    ? resolveFallback(ctx, part)
    : new FormattedDynamic(val, part.meta);
}

function resolveFallback(ctx: Context<unknown, unknown>, part: Part) {
  return new FormattedFallback(fallbackValue(ctx, part), part.meta);
}

function fallbackValue(ctx: Context<unknown, unknown>, part: Part): string {
  const resolve = (p: Part) => resolvePart(ctx, p).valueOf();
  if (isLiteral(part)) return String(part.value);
  if (isVariable(part)) {
    const path = part.var_path.map(resolve);
    return '$' + path.join('.');
  }
  if (isFunction(part)) {
    const args = part.args.map(resolve);
    if (part.options)
      for (const [key, value] of Object.entries(part.options))
        args.push(`${key}: ${value}`);
    return `${part.func}(${args.join(', ')})`;
  }
  if (isTerm(part)) {
    let name = part.msg_path.map(resolve).join('.');
    if (part.res_id) name = part.res_id + '::' + name;
    if (!part.scope) return '-' + name;
    const scope = Object.entries(part.scope).map(([key, value]) => {
      const vs = Array.isArray(value)
        ? `[${value.join(', ')}]`
        : typeof value === 'object'
        ? resolve(value)
        : String(value);
      return `${key}: ${vs}`;
    });
    return `-${name}(${scope.join(', ')})`;
  }
  return String(part);
}
