import type { MessageFormat } from 'messageformat';
import type {
  MessageFunctionContext,
  MessageValue
} from 'messageformat/functions';
import { getLocaleDir } from 'messageformat/functions';
import type { FluentMessageResource } from './index.ts';
import { valueToMessageRef } from './message-to-fluent.ts';

export interface MessageReferenceValue extends MessageValue<'fluent-message'> {
  readonly type: 'fluent-message';
  readonly source: string;
  readonly dir: 'ltr' | 'rtl' | 'auto';
  selectKey(keys: Set<string>): string | null;
  toParts(): [
    {
      type: 'fluent-message';
      source: string;
      dir?: 'ltr' | 'rtl';
      parts: ReturnType<MessageFormat['formatToParts']>;
    }
  ];
  toString(): string;
  valueOf(): string;
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
    const { onError, source } = ctx;
    const locale = ctx.locales[0];
    const dir = ctx.dir ?? getLocaleDir(locale);
    const { msgId, msgAttr } = valueToMessageRef(input ? String(input) : '');
    const mf = res.get(msgId)?.get(msgAttr ?? '');
    if (!mf) throw new Error(`Message not available: ${msgId}`);

    let str: string | undefined;
    return {
      type: 'fluent-message',
      source,
      dir,
      selectKey(keys) {
        str ??= mf.format(options, onError);
        return keys.has(str) ? str : null;
      },
      toParts() {
        const parts = mf.formatToParts(options, onError);
        const res =
          dir === 'ltr' || dir === 'rtl'
            ? { type: 'fluent-message' as const, source, dir, locale, parts }
            : { type: 'fluent-message' as const, source, locale, parts };
        return [res];
      },
      toString: () => (str ??= mf.format(options, onError)),
      valueOf: () => (str ??= mf.format(options, onError))
    };
  };
