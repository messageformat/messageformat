import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { FormattedDynamic, FormattedFallback } from '../formatted-part';
import type { RuntimeType } from '../runtime';
import type { PatternFormatter } from './index';
import { isLiteral, Literal, formatLiteralAsValue } from './literal';

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

export function formatVariableAsPart(
  ctx: Context,
  part: Variable
): FormattedDynamic | FormattedFallback {
  const val = formatVariableAsValue(ctx, part);
  return val !== undefined
    ? new FormattedDynamic(ctx.locales, val, part.meta)
    : new FormattedFallback(ctx.locales, fallbackValue(ctx, part), part.meta);
}

export function formatVariableAsString(ctx: Context, part: Variable): string {
  const val = formatVariableAsValue(ctx, part);
  return val !== undefined ? String(val) : '{' + fallbackValue(ctx, part) + '}';
}

/** @returns `undefined` if value not found */
export function formatVariableAsValue(ctx: Context, part: Variable): unknown {
  const { var_path } = part;
  if (var_path.length === 0) return undefined;
  let val: unknown = ctx.scope;
  for (const p of var_path) {
    try {
      const arg = resolveArgument(ctx, p);
      val = (val as Scope)[String(arg)];
    } catch (_) {
      // TODO: report error
      return undefined;
    }
  }
  return val;
}

function fallbackValue(ctx: Context, { var_path }: Variable): string {
  const path = var_path.map(v => ctx.formatAsPart(v).valueOf());
  return '$' + path.join('.');
}

export function resolveArgument(
  ctx: Context,
  part: PatternElement,
  expected?: RuntimeType
): unknown {
  if (isLiteral(part)) return formatLiteralAsValue(ctx, part, expected);
  if (isVariable(part)) return formatVariableAsValue(ctx, part);
  throw new Error(`Unsupported argument: ${part}`);
}

export const formatter: PatternFormatter = {
  type: 'variable',
  formatAsPart: formatVariableAsPart,
  formatAsString: formatVariableAsString,
  formatAsValue: formatVariableAsValue
};
