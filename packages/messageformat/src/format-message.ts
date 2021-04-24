import {
  FunctionReference,
  isFunctionReference,
  isLiteral,
  isMessageReference,
  isReference,
  isSelect,
  isVariableReference,
  Literal,
  Message,
  MessageReference,
  Part,
  Pattern,
  Select,
  VariableReference
} from './data-model';
import { Context, extendContext } from './format-context';

export type FormattedPart<T = unknown> =
  | { type: 'literal'; value: Literal }
  | { type: 'dynamic'; value: T | undefined }
  | { type: 'message'; value: FormattedPart<T>[] };

export function formatToString<R, S>(ctx: Context<R, S>, { value }: Message) {
  const pattern = isSelect(value) ? resolveSelect(ctx, value) : value;
  let res = '';
  for (const part of pattern) res += resolveAsValue(ctx, part) ?? '';
  return res;
}

export function formatToParts<R, S>(ctx: Context<R, S>, { value }: Message) {
  const pattern = isSelect(value) ? resolveSelect(ctx, value) : value;
  const res: FormattedPart<R | S>[] = [];
  for (const part of pattern) res.push(resolveAsPart<R, S>(ctx, part));
  return res;
}

function resolveAsPart<R, S>(
  ctx: Context<R, S>,
  part: Part
): FormattedPart<R | S> {
  if (isLiteral(part)) return { type: 'literal', value: part };
  if (isVariableReference(part))
    return { type: 'dynamic', value: resolveVariable<R, S>(ctx, part) };
  if (isFunctionReference(part))
    return { type: 'dynamic', value: resolveFormatFunction<R, S>(ctx, part) };
  if (isMessageReference(part)) {
    const { msg, msgCtx } = resolveMessage<R, S>(ctx, part);
    const value = msg ? formatToParts<R, S>(msgCtx, msg) : [];
    return { type: 'message', value };
  }
  /* istanbul ignore next - never happens */
  throw new Error(`Unsupported part: ${part}`);
}

function resolveAsValue<R, S>(
  ctx: Context<R, S>,
  part: Part
): Literal | R | S | undefined {
  if (isLiteral(part)) return part;
  if (isVariableReference(part)) return resolveVariable(ctx, part);
  if (isFunctionReference(part)) return resolveFormatFunction(ctx, part);
  if (isMessageReference(part)) {
    const { msg, msgCtx } = resolveMessage(ctx, part);
    return msg ? formatToString(msgCtx, msg) : '';
  }
  /* istanbul ignore next - never happens */
  return undefined;
}

function resolveFormatFunction<R, S>(
  ctx: Context<R, S>,
  { args, func, options }: FunctionReference
) {
  const fn = ctx.runtime.format[func];
  if (typeof fn !== 'function') return undefined;
  return fn(ctx.locales, options, ...args.map(arg => resolveAsValue(ctx, arg)));
}

function resolveMessage<R, S>(
  ctx: Context<R, S>,
  { msg_path, res_id, scope }: MessageReference
): { msg: Message | null; msgCtx: Context<R, S> } {
  const strPath = msg_path.map(part => String(resolveAsValue(ctx, part)));
  const msg = ctx.getMessage(res_id, strPath);
  if (res_id || scope) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let msgScope: any = undefined;
    if (scope) {
      // Let's not check typings of MessageReference scope overrides
      msgScope = Object.assign({}, ctx.scope);
      for (const [key, value] of Object.entries(scope))
        msgScope[key] = isReference(value) ? resolveAsValue(ctx, value) : value;
    }
    return { msg, msgCtx: extendContext(ctx, res_id, msgScope) };
  }
  return { msg, msgCtx: ctx };
}

function resolveSelect<R, S>(
  ctx: Context<R, S>,
  { select, cases }: Select
): Pattern {
  const res = select.map(part => {
    const v = isFunctionReference(part)
      ? resolveSelectFunction(ctx, part)
      : resolveAsValue(ctx, part);
    return isLiteral(v) || Array.isArray(v) ? v : String(v);
  });
  for (const { key, value } of cases) {
    if (
      key.every((k, i) => {
        const r = res[i];
        return k === 'other' || k === r || (Array.isArray(r) && r.includes(k));
      })
    )
      return value;
  }
  return [];
}

function resolveSelectFunction<R, S>(
  ctx: Context<R, S>,
  { args, func, options }: FunctionReference
) {
  const fn = ctx.runtime.select[func];
  if (typeof fn !== 'function') return undefined;
  return fn(ctx.locales, options, ...args.map(arg => resolveAsValue(ctx, arg)));
}

function resolveVariable<R, S>(
  ctx: Context<R, S>,
  ref: VariableReference
): S | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = ctx.scope;
  for (const key of ref.var_path.map(part => resolveAsValue(ctx, part))) {
    if (!val || typeof val !== 'object') return undefined;
    val = val[key as string];
  }
  return val;
}
