import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { asFormattableX } from '../formattable';
import { FormattableFallback } from '../formattable';
import type { Runtime, RuntimeOptions, RuntimeType } from '../runtime';
import type { Literal, PatternFormatter, Variable } from './index';
import { isLiteral } from './literal';
import { getArgSource } from './util-arg-source';

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
      const res = ctx.getFormatter(value).asFormattable(ctx, value).getValue();
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
  asFormattable(ctx, { args, func, meta, options }: Function) {
    const srcArgs = args.map(getArgSource);
    const source = func + '(' + srcArgs.join(', ') + ')';
    const rf = (ctx.types.function as Runtime)[func];
    try {
      const fnArgs = args.map(arg =>
        ctx.getFormatter(arg).asFormattable(ctx, arg)
      );
      const fnOpt = resolveOptions(ctx, options, rf?.options);
      const res = rf.call(ctx.locales, fnOpt, ...fnArgs);
      return asFormattableX(ctx, res, { meta, source });
    } catch (_) {
      // TODO: report error
      return new FormattableFallback(ctx, meta, { source });
    }
  },
  initContext: mf => mf.resolvedOptions().runtime
};
