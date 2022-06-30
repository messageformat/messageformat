import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import {
  asMessageValue,
  MessageFallback,
  MessageValue
} from '../message-value';
import type { PatternElementResolver } from './index';

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
  var_path: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isVariableRef = (part: any): part is VariableRef =>
  !!part && typeof part === 'object' && part.type === 'variable';

/** @returns `undefined` if value not found */
function getValue(ctx: Context, path: string[]): unknown {
  if (path.length === 0) return undefined;
  let val: unknown = ctx.types.variable;
  for (const p of path) {
    if (!val || val instanceof MessageValue) return undefined;
    val = (val as Scope)[p];
  }
  return val;
}

export const resolver: PatternElementResolver<Scope> = {
  type: 'variable',

  initContext: (_mf, scope) => scope,

  resolve(ctx, { var_path }: VariableRef) {
    const source = '$' + var_path.join('.');
    const value = getValue(ctx, var_path);
    if (value !== undefined)
      return asMessageValue(ctx, value, { source });

    const fb = new MessageFallback(ctx, { source });
    ctx.onError(new Error(`Variable not available: ${source}`), fb);
    return fb;
  }
};
