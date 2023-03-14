import { MessageError } from '../errors';
import type { Context } from '../format-context';
import {
  asMessageValue,
  MessageFallback,
  MessageValue
} from '../message-value';
import { FALLBACK_SOURCE } from '../message-value/message-value';
import type { RuntimeOptions } from '../runtime';
import type { Literal, VariableRef } from './index';

/**
 * To resolve an Expression, an externally defined function is called.
 *
 * @remarks
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

export function resolveExpression(
  ctx: Context,
  { operand, name, options }: Expression
) {
  let source: string | undefined;
  const rf = ctx.runtime[name];
  try {
    let fnArgs: [MessageValue] | [];
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
      throw new MessageError('missing-func', `Unknown function ${name}`);
    }

    const opt: RuntimeOptions = { localeMatcher: ctx.localeMatcher };
    if (options) {
      for (const { name, value } of options) {
        opt[name] = ctx.resolve(value).value;
      }
    }
    const res = rf(ctx.locales, opt, ...fnArgs);
    return asMessageValue(ctx, res, { source });
  } catch (error) {
    source ??= `${name}(${operand ? FALLBACK_SOURCE : ''})`;
    const fb = new MessageFallback(ctx, { source });
    ctx.onError(error, fb);
    return fb;
  }
}
