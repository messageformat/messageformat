import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { asMessageValue, MessageFallback } from '../message-value';
import { FALLBACK_SOURCE } from '../message-value/message-value';
import { MFruntime } from '../messageformat';
import type { Runtime, RuntimeOptions, RuntimeType } from '../runtime';
import type { Literal, PatternElementResolver, VariableRef } from './index';
import { isLiteral } from './literal';

/**
 * To resolve an Expression, an externally defined function is called.
 *
 * The `func` identifies a function that takes in the arguments `args`, the
 * current locale, as well as any `options`, and returns some corresponding
 * output. Likely functions available by default would include `'plural'` for
 * determining the plural category of a numeric value, as well as `'number'`
 * and `'date'` for formatting values.
 */
export interface Expression extends PatternElement {
  type: 'expression';
  func: string;
  args: (Literal | VariableRef)[];
  options?: Record<string, Literal | VariableRef>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isExpression = (part: any): part is Expression =>
  !!part && typeof part === 'object' && part.type === 'expression';

function resolveOptions(
  ctx: Context,
  options: Record<string, Literal | VariableRef> | undefined,
  expected: RuntimeType | Record<string, RuntimeType> | undefined
) {
  const opt: RuntimeOptions = { localeMatcher: ctx.localeMatcher };
  const errorKeys: string[] = [];
  if (options && expected) {
    for (const [key, value] of Object.entries(options)) {
      const exp =
        typeof expected === 'string' || Array.isArray(expected)
          ? expected
          : expected[key];
      if (!exp || exp === 'never') {
        errorKeys.push(key);
        continue;
      }
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
      errorKeys.push(key);
    }
  }
  return { opt, errorKeys };
}

export const resolver: PatternElementResolver<Runtime> = {
  type: 'expression',

  initContext: mf => mf[MFruntime],

  resolve(ctx, { args, func, options }: Expression) {
    let source: string | undefined;
    const rf = (ctx.types.expression as Runtime)[func];
    try {
      const fnArgs = args.map(arg => ctx.resolve(arg));
      const srcArgs = fnArgs
        .map(
          fa =>
            fa.source || (fa.type === 'literal' && fa.value) || FALLBACK_SOURCE
        )
        .join(', ');
      source = `${func}(${srcArgs})`;
      const { opt, errorKeys } = resolveOptions(ctx, options, rf?.options);
      const res = rf.call(ctx.locales, opt, ...fnArgs);
      const mv = asMessageValue(ctx, res, { source });
      for (const key of errorKeys)
        ctx.onError(new TypeError(`Invalid value for option ${key}`), mv);
      return mv;
    } catch (error) {
      if (!source) source = `${func}()`;
      const fb = new MessageFallback(ctx, { source });
      ctx.onError(error, fb);
      return fb;
    }
  }
};
