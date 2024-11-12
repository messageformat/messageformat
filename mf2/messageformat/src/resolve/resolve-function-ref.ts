import { MessageError } from '../errors.js';
import type { Context } from '../format-context.js';
import { fallback } from '../functions/fallback.js';
import { MessageFunctionContext } from './function-context.js';
import { getValueSource, resolveValue } from './resolve-value.js';
import type {
  FunctionRef,
  Literal,
  Options,
  VariableRef
} from '../data-model/types.js';

export function resolveFunctionRef(
  ctx: Context,
  operand: Literal | VariableRef | undefined,
  { name, options }: FunctionRef
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
      throw new MessageError('unknown-function', `Unknown function :${name}`);
    }
    const msgCtx = new MessageFunctionContext(ctx, source, options);
    const opt = resolveOptions(ctx, options);
    const res = rf(msgCtx, opt, ...fnInput);
    if (
      res === null ||
      (typeof res !== 'object' && typeof res !== 'function') ||
      typeof res.type !== 'string' ||
      typeof res.source !== 'string'
    ) {
      throw new MessageError(
        'bad-function-result',
        `Function :${name} did not return a MessageValue`
      );
    }
    if (msgCtx.id && typeof res.toParts === 'function') {
      return {
        ...res,
        toParts() {
          const parts = res.toParts!();
          for (const part of parts) part.id = msgCtx.id;
          return parts;
        }
      };
    }
    return res;
  } catch (error) {
    ctx.onError(error);
    source ??= getValueSource(operand) ?? `:${name}`;
    return fallback(source);
  }
}

function resolveOptions(ctx: Context, options: Options | undefined) {
  const opt: Record<string, unknown> = Object.create(null);
  if (options) {
    for (const [name, value] of options) {
      if (name !== 'u:dir' && name !== 'u:id' && name !== 'u:locale') {
        opt[name] = resolveValue(ctx, value);
      }
    }
  }
  return opt;
}
