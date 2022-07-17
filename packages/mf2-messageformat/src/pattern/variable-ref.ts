import { Context } from '../format-context';
import {
  asMessageValue,
  MessageFallback,
  MessageValue
} from '../message-value';

/**
 * The value of a VariableRef is defined by the current Scope.
 *
 * @remarks
 * To refer to an inner property of an object value, use `.` as a separator;
 * in case of conflict, the longest starting substring wins.
 * For example, `'user.name'` would be first matched by an exactly matching top-level key,
 * and in case that fails, with the `'name'` property of the `'user'` object:
 * The runtime scopes `{ 'user.name': 'Kat' }` and `{ user: { name: 'Kat' } }`
 * would both resolve a `'user.name'` VariableRef as the string `'Kat'`.
 *
 * @beta
 */
export interface VariableRef {
  type: 'variable';
  name: string;
}

/**
 * Type guard for {@link VariableRef} pattern elements
 *
 * @beta
 */
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

export function resolveVariableRef(ctx: Context, { name }: VariableRef) {
  const source = '$' + name;
  let value = getValue(ctx.scope, name);
  if (value === undefined) {
    const decl = ctx.declarations.find(decl => decl.target.name === name);
    if (decl) {
      value = ctx.resolve(decl.value);
      ctx.scope[name] = value;
    }
  }
  if (value !== undefined) return asMessageValue(ctx, value, { source });

  const fb = new MessageFallback(ctx, { source });
  const error = new Error(`Variable not available: ${source}`);
  ctx.onError(Object.assign(error, { type: 'missing-var' }), fb);
  return fb;
}
