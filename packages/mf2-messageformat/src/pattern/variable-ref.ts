import type { PatternElement } from '../data-model';
import {
  asMessageValue,
  MessageFallback,
  MessageValue
} from '../message-value';
import type { PatternElementResolver } from './index';

/**
 * A representation of the parameters/arguments passed to a message formatter.
 * Used by the Variable resolver.
 */
export interface Scope {
  [key: string]: unknown;
}

/**
 * The value of a VariableRef is defined by the current Scope.
 *
 * To refer to an inner property of an object value, use `.` as a separator;
 * in case of conflict, the longest starting substring wins.
 * For example, `'user.name'` would be first matched by an exactly matching top-level key,
 * and in case that fails, with the `'name'` property of the `'user'` object:
 * The runtime scopes `{ 'user.name': 'Kat' }` and `{ user: { name: 'Kat' } }`
 * would both resolve a `'user.name'` VariableRef as the string `'Kat'`.
 */
export interface VariableRef extends PatternElement {
  type: 'variable';
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isVariableRef = (part: any): part is VariableRef =>
  !!part && typeof part === 'object' && part.type === 'variable';

/**
 * Looks for the longest matching `.` delimited starting substring of name.
 * @returns `undefined` if value not found
 */
function getValue(scope: unknown, name: string): unknown {
  if (scope instanceof Object && !(scope instanceof MessageValue)) {
    if (name in scope) return (scope as Record<string, unknown>)[name];

    const parts = name.split('.');
    for (let i = parts.length - 1; i > 0; --i) {
      const head = parts.slice(0, i).join('.');
      if (head in scope) {
        const tail = parts.slice(i).join('.');
        return getValue((scope as Record<string, unknown>)[head], tail);
      }
    }
  }

  return undefined;
}

export const resolver: PatternElementResolver<Scope> = {
  type: 'variable',

  initContext: (_mf, scope) => scope,

  resolve(ctx, { name }: VariableRef) {
    const source = '$' + name;
    const value = getValue(ctx.types.variable, name);
    if (value !== undefined) return asMessageValue(ctx, value, { source });

    const fb = new MessageFallback(ctx, { source });
    ctx.onError(new Error(`Variable not available: ${source}`), fb);
    return fb;
  }
};
