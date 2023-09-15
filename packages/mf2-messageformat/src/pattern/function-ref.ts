import { MessageError } from '../errors.js';
import type { Context } from '../format-context.js';
import { buildFunctionContext, fallback, markup } from '../runtime/index.js';
import type { Literal } from './literal.js';
import { getValueSource, resolveValue } from './value.js';
import type { VariableRef } from './variable-ref.js';

/**
 * To resolve a FunctionRef, an externally defined function is called.
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
export interface FunctionRef {
  type: 'function';
  kind: 'open' | 'close' | 'value';
  name: string;
  operand?: Literal | VariableRef;
  options?: Option[];
}

/**
 * {@link FunctionRef} options are expressed as
 * `key`/`value` pairs to allow their order to be maintained.
 *
 * @beta
 */
export interface Option {
  name: string;
  value: Literal | VariableRef;
}

/**
 * Type guard for {@link FunctionRef} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFunctionRef = (part: any): part is FunctionRef =>
  !!part && typeof part === 'object' && part.type === 'function';

export function functionRefSource(kind: FunctionRef['kind'], name: string) {
  switch (kind) {
    case 'open':
      return `+${name}`;
    case 'close':
      return `-${name}`;
    default:
      return `:${name}`;
  }
}

export function resolveFunctionRef(
  ctx: Context,
  { kind, operand, name, options }: FunctionRef
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
    source ??= functionRefSource(kind, name);

    switch (kind) {
      case 'open':
      case 'close': {
        const opt = options?.length ? resolveOptions(ctx, options) : undefined;
        return markup(source, kind, name, opt, fnInput[0]);
      }
      default: {
        const rf = ctx.functions[name];
        if (!rf) {
          throw new MessageError('missing-func', `Unknown function ${name}`);
        }
        const msgCtx = buildFunctionContext(ctx, source);
        const opt = resolveOptions(ctx, options);
        return rf(msgCtx, opt, ...fnInput);
      }
    }
  } catch (error) {
    ctx.onError(error);
    source ??= getValueSource(operand) ?? functionRefSource(kind, name);
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
