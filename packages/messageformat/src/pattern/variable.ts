import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import {
  asFormattableX,
  Formattable,
  FormattableFallback
} from '../formattable';
import type { Literal, PatternFormatter } from './index';
import { getArgSource } from './util-arg-source';

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

/** @returns `undefined` if value not found */
function getValue(ctx: Context, { var_path }: Variable): unknown {
  if (var_path.length === 0) return undefined;
  let val: unknown = ctx.types.variable;
  for (const p of var_path) {
    if (!val || val instanceof Formattable) return undefined;
    try {
      const arg = ctx.getFormatter(p).asFormattable(ctx, p).getValue();
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
  const path = var_path.map(v =>
    ctx.getFormatter(v).asFormattable(ctx, v).getValue()
  );
  return '$' + path.join('.');
}

export const formatter: PatternFormatter<Scope> = {
  type: 'variable',
  asFormattable(ctx: Context, part: Variable): Formattable {
    const source = getArgSource(part);
    const value = getValue(ctx, part);

    return value === undefined
      ? new FormattableFallback(ctx, part.meta, {
          fallbackString: () => fallbackValue(ctx, part),
          source
        })
      : asFormattableX(ctx, value, { meta: part.meta, source });
  },
  initContext: (_mf, _resId, scope) => scope
};
