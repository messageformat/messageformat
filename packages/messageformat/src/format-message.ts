import {
  Function,
  isFunction,
  isLiteral,
  isReference,
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

export interface FormattedLiteral {
  type: 'literal';
  value: LiteralValue;
  meta?: FormattedMeta;
}
export interface FormattedDynamic<T> {
  type: 'dynamic';
  value: T | string | undefined;
  meta?: FormattedMeta;
}
export interface FormattedMessage<T> {
  type: 'message';
  value: FormattedPart<T>[];
  meta?: FormattedMeta;
}
export type FormattedMeta = Record<string, boolean | number | string | null>;
export type FormattedPart<T = unknown> =
  | FormattedLiteral
  | FormattedDynamic<T>
  | FormattedMessage<T>;

export function formatToString<R, S>(ctx: Context<R, S>, { value }: Message) {
  const pattern = isSelect(value) ? resolveSelect(ctx, value) : value;
  let res = '';
  for (const part of pattern) {
    const value = resolveAsValue(ctx, part) ?? '';
    res +=
      typeof value === 'number' ? value.toLocaleString(ctx.locales) : value;
  }
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
  const res: FormattedPart<R | S>[] = [];
  for (const part of pattern) res.push(resolveAsPart(ctx, part));
  if (meta || fsm) {
    const fm = addMeta({ type: 'message', value: res }, meta);
    if (fsm) fm.meta = Object.assign(fsm, fm.meta);
    return [fm];
  } else return res;
}

function resolveAsPart<R, S>(
  ctx: Context<R, S>,
  part: Part
): FormattedPart<R | S> {
  if (isLiteral(part))
    return addMeta({ type: 'literal', value: part.value }, part.meta);
  if (isVariable(part)) {
    const value = resolveVariable(ctx, part);
    return addMeta({ type: 'dynamic', value }, part.meta);
  }
  if (isFunction(part)) {
    const value = resolveFormatFunction(ctx, part);
    return addMeta({ type: 'dynamic', value }, part.meta);
  }
  if (isTerm(part)) {
    const { msg, msgCtx } = resolveMessage(ctx, part);
    if (!msg) return { type: 'message', value: [] };
    const value = formatToParts(msgCtx, msg);
    return addMeta({ type: 'message', value }, msg.meta);
  }
  /* istanbul ignore next - never happens */
  throw new Error(`Unsupported part: ${part}`);
}

function resolveAsValue<R, S>(
  ctx: Context<R, S>,
  part: Part
): LiteralValue | R | S | undefined {
  if (isLiteral(part)) return part.value;
  if (isVariable(part)) return resolveVariable(ctx, part);
  if (isFunction(part)) return resolveFormatFunction(ctx, part);
  if (isTerm(part)) {
    const { msg, msgCtx } = resolveMessage(ctx, part);
    return msg
      ? formatToString(msgCtx, msg)
      : `{${resolveFallback(ctx, part)}}`;
  }
  /* istanbul ignore next - never happens */
  return undefined;
}

function addMeta(
  fp: FormattedLiteral,
  meta: Meta | undefined
): FormattedLiteral;
function addMeta<T>(
  fp: FormattedDynamic<T>,
  meta: Meta | undefined
): FormattedDynamic<T>;
function addMeta<T>(
  fp: FormattedMessage<T>,
  meta: Meta | undefined
): FormattedMessage<T>;
function addMeta<T>(
  fp: FormattedLiteral | FormattedDynamic<T> | FormattedMessage<T>,
  meta: Meta | undefined
) {
  if (meta) {
    const fm: FormattedMeta = {};
    for (const [key, value] of Object.entries(meta)) {
      switch (typeof value) {
        case 'boolean':
        case 'number':
        case 'string':
          fm[key] = value;
          break;
        case 'object':
          if (value === null) fm[key] = null;
      }
    }
    if (fp.meta) Object.assign(fp.meta, fm);
    else fp.meta = fm;
  }
  return fp;
}

function resolveFormatFunction<R, S>(ctx: Context<R, S>, fn: Function) {
  const { args, func, options } = fn;
  const fnArgs = args.map(arg => resolveAsValue(ctx, arg));
  const rf = ctx.runtime.format[func];
  try {
    return rf(ctx.locales, options, ...fnArgs);
  } catch (_) {
    return `{${resolveFallback(ctx, fn)}}`;
  }
}

function resolveMessage<R, S>(
  ctx: Context<R, S>,
  { msg_path, res_id, scope }: Term
): { msg: Message | null; msgCtx: Context<R, S> } {
  const strPath = msg_path.map(part => String(resolveAsValue(ctx, part)));
  const msg = ctx.getMessage(res_id, strPath);
  if (res_id || scope) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let msgScope: any = undefined;
    if (scope) {
      // Let's not check typings of Term scope overrides
      msgScope = Object.assign({}, ctx.scope);
      for (const [key, value] of Object.entries(scope))
        msgScope[key] = isReference(value) ? resolveAsValue(ctx, value) : value;
    }
    return { msg, msgCtx: extendContext(ctx, res_id, msgScope) };
  }
  return { msg, msgCtx: ctx };
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
      : resolveAsValue(ctx, s.value);
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
  const fnArgs = args.map(arg => resolveAsValue(ctx, arg));
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
): S | string | undefined {
  const { var_path } = part;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = ctx.scope;
  for (const key of var_path.map(part => resolveAsValue(ctx, part))) {
    if (!val || typeof val !== 'object') {
      val = undefined;
      break;
    }
    val = val[key as string];
  }
  return val === undefined ? `{${resolveFallback(ctx, part)}}` : val;
}

function resolveFallback<R, S>(ctx: Context<R, S>, part: Part): string {
  const resolve = resolveAsValue.bind(null, ctx);
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
