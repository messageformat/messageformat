import type {
  MessageExpressionPart,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MessageFormat,
  MessagePart
} from 'messageformat';
import type {
  MessageFunctionContext,
  MessageValue
} from 'messageformat/functions';
import { getLocaleDir } from 'messageformat/functions';
import type { FluentMessageResource } from './index.ts';
import { valueToMessageRef } from './message-to-fluent.ts';

/**
 * The resolved value of a Fluent message or term reference.
 *
 * See {@link getMessageFunction}.
 */
export interface MessageReferenceValue extends MessageValue<'fluent-message'> {
  readonly type: 'fluent-message';
  readonly source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
  selectKey(keys: Set<string>): string | null;
  toParts(): [MessageReferencePart];
  toString(): string;
  valueOf(): string;
}

/**
 * The formatted part for a {@link MessageReferenceValue}.
 */
export interface MessageReferencePart
  extends MessageExpressionPart<'fluent-message'> {
  type: 'fluent-message';
  dir?: 'ltr' | 'rtl';
  parts: MessagePart<string>[];
}

/**
 * Build a custom function for Fluent message and term references.
 *
 * By default, {@link fluentToResource} uses this with the id `fluent:message`.
 *
 * @param res - A Map of {@link MessageFormat} instances,
 *   one for each referrable message and term.
 *   This Map may be passed in as initially empty, and later filled out by the caller.
 */
export const getMessageFunction = (res: FluentMessageResource) =>
  function message(
    ctx: MessageFunctionContext,
    options: Record<string, unknown>,
    input?: unknown
  ): MessageReferenceValue {
    const onError = ctx.onError.bind(ctx);
    const locale = ctx.locales[0];
    const dir = ctx.dir ?? getLocaleDir(locale);
    const { msgId, msgAttr } = valueToMessageRef(input ? String(input) : '');
    const mf = res.get(msgId)?.get(msgAttr ?? '');
    if (!mf) throw new Error(`Message not available: ${msgId}`);

    let str: string | undefined;
    return {
      type: 'fluent-message',
      source: ctx.source,
      dir,
      selectKey(keys) {
        str ??= mf.format(options, onError);
        return keys.has(str) ? str : null;
      },
      toParts() {
        const parts = mf.formatToParts(options, onError);
        const res =
          dir === 'ltr' || dir === 'rtl'
            ? { type: 'fluent-message' as const, dir, locale, parts }
            : { type: 'fluent-message' as const, locale, parts };
        return [res];
      },
      toString: () => (str ??= mf.format(options, onError)),
      valueOf: () => (str ??= mf.format(options, onError))
    };
  };
