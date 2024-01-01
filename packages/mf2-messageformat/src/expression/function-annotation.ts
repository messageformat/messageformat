import { MessageError } from '../errors.js';
import type { Context } from '../format-context.js';
import { MessageFunctionContext, fallback } from '../runtime/index.js';
import type { Literal } from './literal.js';
import { getValueSource, resolveValue } from './value.js';
import type { VariableRef } from './variable-ref.js';

/**
 * To resolve a FunctionAnnotation, an externally defined function is called.
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
export interface FunctionAnnotation {
  type: 'function';
  name: string;
  options?: Option[];
}

/**
 * {@link FunctionAnnotation} options are expressed as
 * `key`/`value` pairs to allow their order to be maintained.
 *
 * @beta
 */
export interface Option {
  name: string;
  value: Literal | VariableRef;
}

/**
 * Type guard for {@link FunctionAnnotation} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFunctionAnnotation = (part: any): part is FunctionAnnotation =>
  !!part && typeof part === 'object' && part.type === 'function';

export function resolveFunctionAnnotation(
  ctx: Context,
  operand: Literal | VariableRef | undefined,
  { name, options }: FunctionAnnotation
) {
  let source: string | undefined;
  try {
    let fnInput: [unknown] | [];
    if (operand) {
      fnInput = [resolveValue(ctx, operand)];
      source = getValueSource(operand);
    } else {
      fnInput = [];
    }
    source ??= `:${name}`;

    const rf = ctx.functions[name];
    if (!rf) {
      throw new MessageError('missing-func', `Unknown function ${name}`);
    }
    const msgCtx = new MessageFunctionContext(ctx, source);
    const opt = resolveOptions(ctx, options);
    return rf(msgCtx, opt, ...fnInput);
  } catch (error) {
    ctx.onError(error);
    source ??= getValueSource(operand) ?? `:${name}`;
    return fallback(source);
  }
}

function resolveOptions(ctx: Context, options: Option[] | undefined) {
  const opt: Record<string, unknown> = Object.create(null);
  if (options) {
    for (const { name, value } of options) {
      opt[name] = resolveValue(ctx, value);
    }
  }
  return opt;
}
