import type { Context } from '../format-context';
import {
  asMessageValue,
  MessageFallback,
  MessageValue
} from '../message-value';
import { FALLBACK_SOURCE } from '../message-value/message-value';
import type { RuntimeOptions, RuntimeType } from '../runtime';
import type { Literal, VariableRef } from './index';
import { isLiteral } from './literal';

/**
 * To resolve an Expression, an externally defined function is called.
 *
 * The `name` identifies a function that takes in the arguments `args`, the
 * current locale, as well as any `options`, and returns some corresponding
 * output. Likely functions available by default would include `'plural'` for
 * determining the plural category of a numeric value, as well as `'number'`
 * and `'date'` for formatting values.
 *
 * @beta
 */
export interface Expression {
  type: 'expression';
  name: string;
  operand?: Literal | VariableRef;
  options?: Option[];
}

/**
 * {@link Expression} and {@link MarkupStart} options are expressed as
 * `key`/`value` pairs to allow their order to be maintained.
 *
 * @beta
 */
export interface Option {
  name: string;
  value: Literal | VariableRef;
}

/**
 * Type guard for {@link Expression} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isExpression = (part: any): part is Expression =>
  !!part && typeof part === 'object' && part.type === 'expression';

function resolveOptions(
  ctx: Context,
  options: Option[] | undefined,
  expected: RuntimeType | Record<string, RuntimeType> | undefined
) {
  const opt: RuntimeOptions = { localeMatcher: ctx.localeMatcher };
  const errorKeys: string[] = [];
  if (options && expected) {
    for (const { name, value } of options) {
      const exp =
        typeof expected === 'string' || Array.isArray(expected)
          ? expected
          : expected[name];
      const { res, valid } = resolveOptionValue(ctx, exp, value);
      opt[name] = res;
      if (!valid) errorKeys.push(name);
    }
  }
  return { opt, errorKeys };
}

function resolveOptionValue(
  ctx: Context,
  exp: RuntimeType | undefined,
  elem: Literal | VariableRef
): { res: unknown; valid: boolean } {
  const { value } = ctx.resolve(elem);

  if (
    exp === 'any' ||
    exp === typeof value ||
    (Array.isArray(exp) && typeof value === 'string' && exp.includes(value))
  ) {
    return { res: value, valid: true };
  }

  if (isLiteral(elem)) {
    switch (exp) {
      case 'boolean':
        if (value === 'true') return { res: true, valid: true };
        if (value === 'false') return { res: false, valid: true };
        return { res: value === '0' ? false : Boolean(value), valid: false };
      case 'number': {
        const num = Number(value);
        return { res: num, valid: Number.isFinite(num) };
      }
    }
  }

  return { res: value, valid: false };
}

export function resolveExpression(
  ctx: Context,
  { operand, name, options }: Expression
) {
  let source: string | undefined;
  const rf = ctx.runtime[name];
  try {
    let fnArgs: MessageValue[];
    if (operand) {
      const arg = ctx.resolve(operand);
      fnArgs = [arg];
      const argSrc =
        arg.source || (arg.type === 'literal' && arg.value) || FALLBACK_SOURCE;
      source = `${argSrc} :${name}`;
    } else {
      fnArgs = [];
      source = `:${name}`;
    }
    if (!rf) {
      const error = new ReferenceError(`Unknown formatter ${name}`);
      throw Object.assign(error, { type: 'missing-func' });
    }
    const { opt, errorKeys } = resolveOptions(ctx, options, rf.options);
    const res = rf.call(ctx.locales, opt, ...fnArgs);
    const mv = asMessageValue(ctx, res, { source });
    for (const key of errorKeys) {
      const error = new TypeError(`Invalid value for option ${key}`);
      ctx.onError(Object.assign(error, { type: 'invalid-type' }), mv);
    }
    return mv;
  } catch (error) {
    source ??= `${name}(${operand ? FALLBACK_SOURCE : ''})`;
    const fb = new MessageFallback(ctx, { source });
    ctx.onError(error, fb);
    return fb;
  }
}
