import type {
  FunctionRef,
  Literal,
  Options,
  VariableRef
} from '../data-model/types.ts';
import { MessageError, MessageResolutionError } from '../errors.ts';
import type { Context } from '../format-context.ts';
import { fallback } from '../functions/fallback.ts';
import type { MessageFallback } from '../functions/index.ts';
import { BIDI_ISOLATE, type MessageValue } from '../message-value.ts';
import { MessageFunctionContext } from './function-context.ts';
import { getValueSource, resolveValue } from './resolve-value.ts';

export function resolveFunctionRef<T extends string, P extends string>(
  ctx: Context<T, P>,
  operand: Literal | VariableRef | undefined,
  { name, options }: FunctionRef
): (MessageValue<T, P> & { source: string }) | MessageFallback {
  const fnSource = `:${name}`;
  const source = getValueSource(operand) ?? fnSource;
  try {
    const fnInput = operand ? [resolveValue(ctx, operand)] : [];
    const rf = ctx.functions[name];
    if (!rf) {
      throw new MessageResolutionError(
        'unknown-function',
        `Unknown function ${fnSource}`,
        source
      );
    }

    const msgCtx = new MessageFunctionContext(ctx, source, options);
    const opt = resolveOptions(ctx, options);
    const res = rf(msgCtx, opt, ...fnInput);
    if (
      res === null ||
      typeof res !== 'object' ||
      typeof res.type !== 'string'
    ) {
      throw new MessageResolutionError(
        'bad-function-result',
        `Function ${fnSource} did not return a MessageValue`,
        source
      );
    }

    const override = { source } as { source: string } & {
      -readonly [K in keyof MessageValue<T, P>]: MessageValue<T, P>[K];
    };
    if (msgCtx.dir) {
      override.dir = msgCtx.dir;
      override[BIDI_ISOLATE] = true;
    }
    if (msgCtx.id && typeof res.toParts === 'function') {
      override.toParts = () => {
        const parts = res.toParts!();
        for (const part of parts) part.id = msgCtx.id;
        return parts;
      };
    }

    return { ...res, ...override };
  } catch (error) {
    ctx.onError(
      error instanceof MessageError
        ? error
        : new MessageResolutionError(
            'bad-function-result',
            String(error),
            source,
            error
          )
    );
    return fallback(source);
  }
}

function resolveOptions(ctx: Context, options: Options | undefined) {
  const opt: Record<string, unknown> = Object.create(null);
  if (options) {
    for (const [name, value] of options) {
      if (!name.startsWith('u:')) opt[name] = resolveValue(ctx, value);
    }
  }
  return opt;
}
