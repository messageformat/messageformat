import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import {
  argumentSource,
  formatValueAsParts,
  MessageFormatPart
} from '../formatted-part';
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

export function formatVariableAsParts(
  ctx: Context,
  part: Variable
): MessageFormatPart[] {
  const value = formatVariableAsValue(ctx, part);
  const source = argumentSource(part);
  const res: MessageFormatPart[] =
    value === undefined
      ? [{ type: 'fallback', value: fallbackValue(ctx, part), source }]
      : formatValueAsParts(ctx, value, source);
  if (part.meta) for (const fmt of res) fmt.meta = { ...part.meta };
  return res;
}

export function formatVariableAsString(ctx: Context, part: Variable): string {
  const val = formatVariableAsValue(ctx, part);
  return val !== undefined
    ? ctx.stringify(val)
    : '{' + fallbackValue(ctx, part) + '}';
}

/** @returns `undefined` if value not found */
export function formatVariableAsValue(ctx: Context, part: Variable): unknown {
  const { var_path } = part;
  if (var_path.length === 0) return undefined;
  let val: unknown = ctx.types.variable;
  for (const p of var_path) {
    try {
      const arg = ctx.formatAsValue(p);
      val = (val as Scope)[String(arg)];
    } catch (_) {
      // TODO: report error
      return undefined;
    }
  }
  return val;
}

function fallbackValue(ctx: Context, { var_path }: Variable): string {
  const path = var_path.map(v => ctx.formatAsValue(v));
  return '$' + path.join('.');
}

export const formatter: PatternFormatter<Scope> = {
  type: 'variable',
  formatAsParts: formatVariableAsParts,
  formatAsString: formatVariableAsString,
  formatAsValue: formatVariableAsValue,
  initContext: (_mf, _resId, scope) => scope
};
