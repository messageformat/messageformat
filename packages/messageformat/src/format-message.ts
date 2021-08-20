import {
  isSelectMessage,
  Message,
  Meta,
  PatternElement,
  SelectMessage,
  Selector
} from './data-model';
import { FormattedSelectMeta, getFormattedSelectMeta } from './detect-grammar';
import type { Context } from './format-context';
import { isFunction, resolveFunction } from './pattern/function';
import { isLiteral, resolveLiteral } from './pattern/literal';
import { isTerm, resolveTerm } from './pattern/term';
import { isVariable, resolveVariable } from './pattern/variable';

export abstract class Formatted<T> {
  abstract type: 'dynamic' | 'fallback' | 'literal' | 'message';
  abstract valueOf(): T | string;

  #locales: string[];
  value: T;
  declare meta?: Meta;

  constructor(
    locales: string[],
    value: T | Formatted<T> | FormattedMessage<unknown>,
    meta?: Meta
  ) {
    this.#locales = locales;
    if (value instanceof Formatted) {
      this.value = value.valueOf() as T; // T is always string for FormattedMessage value
      if (value.meta) addMeta(this, value.meta);
    } else this.value = value;
    if (meta) addMeta(this, meta);
  }

  toString() {
    // TS doesn't believe toLocaleString is defined for ~everything
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v: any = this.value;
    return v != null && typeof v.toLocaleString === 'function'
      ? v.toLocaleString(this.#locales)
      : String(v);
  }
}

export class FormattedDynamic<T = string> extends Formatted<T> {
  type = 'dynamic' as const;
  valueOf() {
    return this.value;
  }
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
export class FormattedLiteral extends Formatted<string> {
  type = 'literal' as const;
  valueOf() {
    return this.value;
  }
}
export class FormattedMessage<T = unknown> extends Formatted<
  FormattedPart<T>[]
> {
  type = 'message' as const;
  toString() {
    let res = '';
    for (const fp of this.value) res += fp.toString();
    return res;
  }
  valueOf() {
    return this.toString();
  }
}

export type FormattedPart<T = unknown> =
  | FormattedDynamic<T>
  | FormattedFallback
  | FormattedMessage<T>
  // should be FormattedLiteral<T>, but TS can't cope with it
  | (T extends string ? FormattedLiteral : never);

export function addMeta(fmt: Formatted<unknown>, meta: Meta) {
  if (!fmt.meta) fmt.meta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (key in fmt.meta) continue;
    fmt.meta[key] = value;
  }
}

export function formatToString(ctx: Context, msg: Message) {
  let res = '';
  for (const fp of formatToParts(ctx, msg)) res += fp.toString();
  return res;
}

export function formatToParts<R, S>(
  ctx: Context,
  msg: Message
): FormattedPart<R | S | string>[] {
  let fsm: FormattedSelectMeta | null = null;
  const pattern = isSelectMessage(msg)
    ? resolveSelect(ctx, msg, _fsm => (fsm = _fsm))
    : msg.value;
  const res = pattern.map(part => resolvePart<R, S>(ctx, part));
  if (msg.meta || fsm) {
    const fm = new FormattedMessage<R | S | string>(ctx.locales, res, msg.meta);
    if (fsm) addMeta(fm, fsm);
    return [fm];
  } else return res;
}

export function resolvePart<R, S>(
  ctx: Context,
  part: PatternElement
):
  | FormattedDynamic<R | S>
  | FormattedFallback
  | FormattedLiteral
  | FormattedMessage<R | S | string> {
  if (isLiteral(part)) return resolveLiteral(ctx, part);
  if (isVariable(part)) return resolveVariable(ctx, part);
  if (isFunction(part)) return resolveFunction(ctx, part);
  if (isTerm(part)) return resolveTerm(ctx, part);
  /* istanbul ignore next - never happens */
  throw new Error(`Unsupported part: ${part}`);
}

function resolveSelect(
  ctx: Context,
  select: SelectMessage,
  onMeta?: (meta: FormattedSelectMeta) => void
): PatternElement[] {
  const res = select.select.map(s => ({
    value: resolveSelectorValue(ctx, s),
    default: s.default || 'other'
  }));

  for (const { key, value } of select.cases) {
    if (
      key.every((k, i) => {
        const r = res[i];
        return k === r.default || r.value.includes(k);
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

function resolveSelectorValue(ctx: Context, { value }: Selector): string[] {
  let res = resolvePart(ctx, value).valueOf();
  if (typeof res === 'number') {
    try {
      res = ctx.runtime.plural.call(ctx.locales, undefined, res);
    } catch (_) {
      // TODO: report error
    }
  }

  return Array.isArray(res) && res.every(r => typeof r === 'string')
    ? res
    : [String(res)];
}
