import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import {
  argumentSource,
  formatValueToParts,
  MessageFormatPart
} from '../formatted-part';
import { Formattable } from '../formattable';
import type { Runtime, RuntimeOptions, RuntimeType } from '../runtime';
import type { Literal, PatternFormatter, Variable } from './index';
import { isLiteral } from './literal';

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

export function formatFunctionToParts(
  ctx: Context,
  fn: Function
): MessageFormatPart[] {
  const srcArgs = fn.args.map(argumentSource);
  const source = fn.func + '(' + srcArgs.join(', ') + ')';
  let res: MessageFormatPart[];
  try {
    const value = callRuntimeFunction(ctx, fn);
    res = formatValueToParts(ctx, value, source);
  } catch (error) {
    res = [
      {
        type: 'fallback',
        value: fallbackValue(ctx, fn),
        source,
        meta: {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack
        }
      }
    ];
  }
  if (fn.meta) for (const fmt of res) fmt.meta = { ...fn.meta, ...fmt.meta };
  return res;
}

export function formatFunctionToString(ctx: Context, fn: Function): string {
  try {
    const res = callRuntimeFunction(ctx, fn);
    return res instanceof Formattable ? res.toString() : ctx.stringify(res);
  } catch (_) {
    // TODO: report error
    return '{' + fallbackValue(ctx, fn) + '}';
  }
}

export function formatFunctionToValue(
  ctx: Context,
  fn: Function,
  formattable?: globalThis.Function
): unknown {
  try {
    const res = callRuntimeFunction(ctx, fn);
    return res instanceof Formattable &&
      !(formattable && res instanceof formattable)
      ? res.valueOf()
      : res;
  } catch (_) {
    // TODO: report error
    return undefined;
  }
}

function callRuntimeFunction(ctx: Context, { args, func, options }: Function) {
  const rf = (ctx.types.function as Runtime)[func];
  const fnArgs = args.map(arg => ctx.formatToValue(arg, rf.formattable));
  const fnOpt = resolveOptions(ctx, options, rf?.options);
  return rf.call(ctx.locales, fnOpt, ...fnArgs);
}

function fallbackValue(ctx: Context, fn: Function) {
  const resolve = (v: Literal | Variable) => ctx.formatToValue(v);
  const args = fn.args.map(resolve);
  if (fn.options)
    for (const [key, value] of Object.entries(fn.options))
      args.push(`${key}: ${resolve(value)}`);
  return `${fn.func}(${args.join(', ')})`;
}

function resolveOptions(
  ctx: Context,
  options: Record<string, Literal | Variable> | undefined,
  expected: RuntimeType | Record<string, RuntimeType> | undefined
) {
  const opt: RuntimeOptions = { localeMatcher: ctx.localeMatcher };
  if (options && expected) {
    for (const [key, value] of Object.entries(options)) {
      const exp =
        typeof expected === 'string' || Array.isArray(expected)
          ? expected
          : expected[key];
      if (!exp || exp === 'never') continue; // TODO: report error
      const res = ctx.formatToValue(value);
      if (
        exp === 'any' ||
        exp === typeof res ||
        (Array.isArray(exp) && typeof res === 'string' && exp.includes(res))
      ) {
        opt[key] = res;
      } else if (isLiteral(value)) {
        switch (exp) {
          case 'boolean':
            if (res === 'true') opt[key] = true;
            else if (res === 'false') opt[key] = false;
            break;
          case 'number':
            opt[key] = Number(res);
        }
      }
      // TODO: else report error
    }
  }
  return opt;
}

export const formatter: PatternFormatter<Runtime> = {
  type: 'function',
  formatToParts: formatFunctionToParts,
  formatToString: formatFunctionToString,
  formatToValue: formatFunctionToValue,
  initContext: mf => mf.resolvedOptions().runtime
};
