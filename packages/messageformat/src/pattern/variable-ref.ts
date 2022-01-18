import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import {
  asFormattable,
  Formattable,
  FormattableFallback
} from '../formattable';
import type { Literal, PatternElementResolver } from './index';

/**
 * A representation of the parameters/arguments passed to a message formatter.
 * Used by the Variable resolver, and may be extended in a Term.
 */
export interface Scope {
  [key: string]: unknown;
}

/**
 * The value of a VariableRef is defined by the current Scope.
 *
 * Using an array with more than one value refers to an inner property of an
 * object value, so e.g. `['user', 'name']` would require something like
 * `{ name: 'Kat' }` as the value of the `'user'` scope variable.
 */
export interface VariableRef extends PatternElement {
  type: 'variable';
  var_path: (Literal | VariableRef)[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isVariableRef = (part: any): part is VariableRef =>
  !!part && typeof part === 'object' && part.type === 'variable';

function getPath(
  ctx: Context,
  { var_path }: VariableRef,
  onError: (error: unknown) => void
): string[] {
  const path: string[] = [];
  for (const p of var_path) {
    try {
      const fmt = ctx.resolve(p);
      const val = fmt.getValue();
      if (val === undefined) {
        onError(new TypeError('Variable path part cannot be undefined'));
        path.push(fmt.toString());
      } else path.push(String(val));
    } catch (error) {
      onError(error);
      path.push('???');
    }
  }
  return path;
}

/** @returns `undefined` if value not found */
function getValue(ctx: Context, path: string[]): unknown {
  if (path.length === 0) return undefined;
  let val: unknown = ctx.types.variable;
  for (const p of path) {
    if (!val || val instanceof Formattable) return undefined;
    val = (val as Scope)[p];
  }
  return val;
}

export const resolver: PatternElementResolver<Scope> = {
  type: 'variable',

  initContext: (_mf, _resId, scope) => scope,

  resolve(ctx, elem: VariableRef) {
    let error: unknown;
    const path = getPath(ctx, elem, err => (error = err));
    const source = '$' + path.join('.');
    const value = error ? undefined : getValue(ctx, path);

    return value === undefined
      ? new FormattableFallback(ctx, elem.meta, { source })
      : asFormattable(ctx, value, { meta: elem.meta, source });
  }
};
