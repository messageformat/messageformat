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
 */
export interface Expression {
  type: 'expression';
  name: string;
  operand?: Literal | VariableRef;
  options?: Option[];
}

export interface Option {
  name: string;
  value: Literal | VariableRef;
}

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
      if (!exp || exp === 'never') {
        errorKeys.push(name);
        continue;
      }
      const res = ctx.resolve(value).value;
      if (
        exp === 'any' ||
        exp === typeof res ||
        (Array.isArray(exp) && typeof res === 'string' && exp.includes(res))
      ) {
        opt[name] = res;
      } else if (isLiteral(value)) {
        switch (exp) {
          case 'boolean':
            if (res === 'true') opt[name] = true;
            else if (res === 'false') opt[name] = false;
            break;
          case 'number':
            opt[name] = Number(res);
        }
      }
      errorKeys.push(name);
    }
  }
  return { opt, errorKeys };
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
      source = `${name}(${argSrc})`;
    } else {
      fnArgs = [];
      source = `${name}()`;
    }
    const { opt, errorKeys } = resolveOptions(ctx, options, rf?.options);
    const res = rf.call(ctx.locales, opt, ...fnArgs);
    const mv = asMessageValue(ctx, res, { source });
    for (const key of errorKeys)
      ctx.onError(new TypeError(`Invalid value for option ${key}`), mv);
    return mv;
  } catch (error) {
    source ??= `${name}(${operand ? FALLBACK_SOURCE : ''})`;
    const fb = new MessageFallback(ctx, { source });
    ctx.onError(error, fb);
    return fb;
  }
}
