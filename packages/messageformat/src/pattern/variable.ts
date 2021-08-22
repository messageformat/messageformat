import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { Formattable } from '../formattable';
import { argumentSource, MessageFormatPart } from '../formatted-part';
import type { Literal, PatternFormatter } from './index';

/**
 * A representation of the parameters/arguments passed to a message formatter.
 * Used by the Variable resolver, and may be extended in a Term.
 */
export interface Scope {
  [key: string]: unknown;
}

/**
 * Variables are defined by the current Scope.
 *
 * Using an array with more than one value refers to an inner property of an
 * object value, so e.g. `['user', 'name']` would require something like
 * `{ name: 'Kat' }` as the value of the `'user'` scope variable.
 */
export interface Variable extends PatternElement {
  type: 'variable';
  var_path: (Literal | Variable)[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isVariable = (part: any): part is Variable =>
  !!part && typeof part === 'object' && part.type === 'variable';

export function formatVariableToParts(
  ctx: Context,
  part: Variable
): MessageFormatPart[] {
  const value = getValue(ctx, part);
  const source = argumentSource(part);
  const opt = { localeMatcher: ctx.localeMatcher };
  const res: MessageFormatPart[] =
    value === undefined
      ? [{ type: 'fallback', value: fallbackValue(ctx, part), source }]
      : Formattable.from(value).toParts(ctx.locales, opt, source);
  if (part.meta) for (const fmt of res) fmt.meta = { ...part.meta };
  return res;
}

export function formatVariableToString(ctx: Context, part: Variable): string {
  const value = getValue(ctx, part);
  const opt = { localeMatcher: ctx.localeMatcher };
  return value === undefined
    ? '{' + fallbackValue(ctx, part) + '}'
    : Formattable.from(value).toString(ctx.locales, opt);
}

/** @returns `undefined` if value not found */
export function formatVariableToValue(
  ctx: Context,
  part: Variable,
  formattable?: globalThis.Function
): unknown {
  const value = getValue(ctx, part);
  return value instanceof Formattable &&
    !(formattable && value instanceof formattable)
    ? value.valueOf()
    : value;
}

/** @returns `undefined` if value not found */
function getValue(ctx: Context, { var_path }: Variable): unknown {
  if (var_path.length === 0) return undefined;
  let val: unknown = ctx.types.variable;
  for (const p of var_path) {
    try {
      const arg = ctx.formatToValue(p);
      if (arg === undefined) return undefined;
      val = (val as Scope)[String(arg)];
    } catch (_) {
      // TODO: report error
      return undefined;
    }
  }
  return val;
}

function fallbackValue(ctx: Context, { var_path }: Variable): string {
  const path = var_path.map(v => ctx.formatToValue(v));
  return '$' + path.join('.');
}

export const formatter: PatternFormatter<Scope> = {
  type: 'variable',
  formatToParts: formatVariableToParts,
  formatToString: formatVariableToString,
  formatToValue: formatVariableToValue,
  initContext: (_mf, _resId, scope) => scope
};
