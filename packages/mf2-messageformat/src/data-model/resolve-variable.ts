import { MessageResolutionError } from '../errors.js';
import type { Context } from '../format-context.js';
import { fallback } from '../functions/fallback.js';
import { MessageFunctionContext, MessageValue } from '../functions/index.js';
import { unknown } from '../functions/unknown.js';
import type { Expression, VariableRef } from './types.js';
import { resolveExpression } from './resolve-expression.js';

/**
 * Declarations aren't resolved until they're requierd,
 * and their resolution order matters for variable resolution.
 * This internal class is used to store any required data,
 * and to allow for `instanceof` detection.
 * @private
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
  scope instanceof Object;

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
    ctx.onError(new MessageResolutionError('unresolved-var', msg, source));
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

export function resolveVariableRef(ctx: Context, ref: VariableRef) {
  const source = '$' + ref.name;
  const value = lookupVariableRef(ctx, ref);

  let type = typeof value;
  if (type === 'object') {
    const mv = value as MessageValue;
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
