import type { Expression, VariableRef } from '../data-model/types.ts';
import { MessageResolutionError } from '../errors.ts';
import type { Context } from '../format-context.ts';
import { fallback } from '../functions/fallback.ts';
import { unknown } from '../functions/unknown.ts';
import { MessageValue } from '../message-value.ts';
import { MessageFunctionContext } from './function-context.ts';
import { resolveExpression } from './resolve-expression.ts';

/**
 * Declarations aren't resolved until they're requierd,
 * and their resolution order matters for variable resolution.
 * This internal class is used to store any required data,
 * and to allow for `instanceof` detection.
 *
 * @internal
 */
export class UnresolvedExpression {
  expression: Expression;
  scope: Record<string, unknown> | undefined;
  constructor(expression: Expression, scope?: Record<string, unknown>) {
    this.expression = expression;
    this.scope = scope;
  }
}

const isScope = (scope: unknown): scope is Record<string, unknown> =>
  scope !== null && (typeof scope === 'object' || typeof scope === 'function');

/**
 * Looks for the longest matching `.` delimited starting substring of name.
 * @returns `undefined` if value not found
 */
function getValue(scope: unknown, name: string): unknown {
  if (isScope(scope)) {
    if (name in scope) return scope[name];

    const parts = name.split('.');
    for (let i = parts.length - 1; i > 0; --i) {
      const head = parts.slice(0, i).join('.');
      if (head in scope) {
        const tail = parts.slice(i).join('.');
        return getValue(scope[head], tail);
      }
    }

    for (const [key, value] of Object.entries(scope)) {
      if (key.normalize() === name) return value;
    }
  }

  return undefined;
}

/**
 * Get the raw value of a variable.
 * Resolves declarations as necessary
 *
 * @internal
 * @returns `unknown` or `any` for input values;
 *   `MessageValue` for `.input` and `.local` declaration values.
 */
export function lookupVariableRef(ctx: Context, { name }: VariableRef) {
  const value = getValue(ctx.scope, name);
  if (value === undefined) {
    const source = '$' + name;
    const msg = `Variable not available: ${source}`;
    ctx.onError(new MessageResolutionError('unresolved-variable', msg, source));
  } else if (value instanceof UnresolvedExpression) {
    const local = resolveExpression(
      value.scope ? { ...ctx, scope: value.scope } : ctx,
      value.expression
    );
    ctx.scope[name] = local;
    ctx.localVars.add(local);
    return local;
  }
  return value;
}

export function resolveVariableRef<T extends string, P extends string>(
  ctx: Context<T, P>,
  ref: VariableRef
) {
  const source = '$' + ref.name;
  const value = lookupVariableRef(ctx, ref);

  let type = typeof value;
  if (type === 'object') {
    const mv = value as MessageValue<T, P>;
    if (mv.type === 'fallback') return fallback(source);
    if (ctx.localVars.has(mv)) return mv;
    if (value instanceof Number) type = 'number';
    else if (value instanceof String) type = 'string';
  }

  switch (type) {
    case 'bigint':
    case 'number': {
      const msgCtx = new MessageFunctionContext(ctx, source);
      return ctx.functions.number(msgCtx, {}, value);
    }
    case 'string': {
      const msgCtx = new MessageFunctionContext(ctx, source);
      return ctx.functions.string(msgCtx, {}, value);
    }
  }

  return value === undefined ? fallback(source) : unknown(source, value);
}
