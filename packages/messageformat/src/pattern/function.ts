import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import {
  addMeta,
  Formatted,
  FormattedDynamic,
  FormattedFallback,
  FormattedLiteral,
  FormattedMessage,
  resolvePart
} from '../format-message';
import type { RuntimeType } from '../runtime';
import type { Literal } from './literal';
import { resolveArgument, Variable } from './variable';

/**
 * To resolve a Function, an externally defined function is called.
 *
 * The `func` identifies a function that takes in the arguments `args`, the
 * current locale, as well as any `options`, and returns some corresponding
 * output. Likely functions available by default would include `'plural'` for
 * determining the plural category of a numeric value, as well as `'number'`
 * and `'date'` for formatting values.
 */
export interface Function extends PatternElement {
  type: 'function';
  func: string;
  args: (Literal | Variable)[];
  options?: Record<string, Literal | Variable>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFunction = (part: any): part is Function =>
  !!part && typeof part === 'object' && part.type === 'function';

export function resolveFunction<R, S>(
  ctx: Context,
  fn: Function
): FormattedDynamic<R> | FormattedFallback | FormattedMessage<R | S | string> {
  const { args, func, options } = fn;
  const rf = ctx.runtime[func];
  const fnArgs = args.map(arg => resolveArgument(ctx, arg));
  const fnOpt = resolveOptions(ctx, options, rf?.options);
  try {
    const value = rf.call(ctx.locales, fnOpt, ...fnArgs);
    if (value instanceof Formatted && !(value instanceof FormattedLiteral)) {
      if (fn.meta) addMeta(value, fn.meta);
      return value as
        | FormattedDynamic<R>
        | FormattedFallback
        | FormattedMessage<R | S | string>;
    }
    return new FormattedDynamic(ctx.locales, value as R, fn.meta);
  } catch (error) {
    const fb = new FormattedFallback(
      ctx.locales,
      fallbackValue(ctx, fn),
      fn.meta
    );
    addMeta(fb, {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack
    });
    return fb;
  }
}

function fallbackValue(ctx: Context, fn: Function) {
  const resolve = (v: Literal | Variable) => resolvePart(ctx, v).valueOf();
  const args = fn.args.map(resolve);
  if (fn.options)
    for (const [key, value] of Object.entries(fn.options))
      args.push(`${key}: ${resolve(value)}`);
  return `${fn.func}(${args.join(', ')})`;
}

export function resolveOptions<S>(
  ctx: Context,
  options: Record<string, Literal | Variable> | undefined,
  expected: RuntimeType | Record<string, RuntimeType> | undefined
) {
  const opt: Record<string, string | number | boolean | S> = {};
  const getExpected =
    !expected || typeof expected === 'string' || Array.isArray(expected)
      ? () => expected
      : (key: string) => expected[key];
  if (options && expected)
    for (const [key, value] of Object.entries(options)) {
      const exp = getExpected(key);
      if (!exp || exp === 'never') continue; // TODO: report error
      const res = resolveArgument<S>(ctx, value, exp);

      if (
        exp === 'any' ||
        exp === typeof res ||
        (Array.isArray(exp) && typeof res === 'string' && exp.includes(res))
      )
        opt[key] = res;
      // TODO: else report error
    }
  return opt;
}
