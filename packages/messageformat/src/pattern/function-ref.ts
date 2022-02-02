import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { asMessageValue, MessageFallback } from '../message-value';
import { FALLBACK_SOURCE } from '../message-value/message-value';
import { MFruntime } from '../messageformat';
import type { Runtime, RuntimeOptions, RuntimeType } from '../runtime';
import type { Literal, PatternElementResolver, VariableRef } from './index';
import { isLiteral } from './literal';

/**
 * To resolve a FunctionRef, an externally defined function is called.
 *
 * The `func` identifies a function that takes in the arguments `args`, the
 * current locale, as well as any `options`, and returns some corresponding
 * output. Likely functions available by default would include `'plural'` for
 * determining the plural category of a numeric value, as well as `'number'`
 * and `'date'` for formatting values.
 */
export interface FunctionRef extends PatternElement {
  type: 'function';
  func: string;
  args: (Literal | VariableRef)[];
  options?: Record<string, Literal | VariableRef>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFunctionRef = (part: any): part is FunctionRef =>
  !!part && typeof part === 'object' && part.type === 'function';

function resolveOptions(
  ctx: Context,
  options: Record<string, Literal | VariableRef> | undefined,
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
      const res = ctx.resolve(value).value;
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

export const resolver: PatternElementResolver<Runtime> = {
  type: 'function',

  initContext: mf => mf[MFruntime],

  resolve(ctx, { args, func, meta, options }: FunctionRef) {
    let source: string | undefined;
    const rf = (ctx.types.function as Runtime)[func];
    try {
      const fnArgs = args.map(arg => ctx.resolve(arg));
      const srcArgs = fnArgs.map(fa => fa.source || FALLBACK_SOURCE).join(', ');
      source = `${func}(${srcArgs})`;
      const fnOpt = resolveOptions(ctx, options, rf?.options);
      const res = rf.call(ctx.locales, fnOpt, ...fnArgs);
      return asMessageValue(ctx, res, { meta, source });
    } catch (_) {
      // TODO: report error
      if (!source) source = `${func}()`;
      return new MessageFallback(ctx, meta, { source });
    }
  }
};
