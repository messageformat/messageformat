import { PatternElement } from '../data-model';
import { Context } from '../format-context';
import {
  FormattedDynamic,
  FormattedFallback,
  resolveArgument,
  resolvePart
} from '../format-message';
import type { Literal } from './literal';

/**
 * A representation of the parameters/arguments passed to a message formatter.
 * Used by the Variable resolver, and may be extended in a Term.
 */
export interface Scope<S = unknown> {
  [key: string]: S;
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

export function resolveVariable<R, S>(
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
    val = val[resolveArgument(ctx, p)];
  }
  return val === undefined
    ? new FormattedFallback(ctx.locales, fallbackValue(ctx, part), part.meta)
    : new FormattedDynamic(ctx.locales, val, part.meta);
}

function fallbackValue(
  ctx: Context<unknown, unknown>,
  { var_path }: Variable
): string {
  const path = var_path.map(v => resolvePart(ctx, v).valueOf());
  return '$' + path.join('.');
}
