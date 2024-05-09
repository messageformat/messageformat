import { MessageResolutionError } from 'messageformat';
import type {
  MessageFunctionContext,
  MessageValue
} from 'messageformat/functions';
import { asPositiveInteger } from 'messageformat/functions/utils';

const NotFormattable = Symbol('not-formattable');
const NotSelectable = Symbol('not-selectable');

export function testNumeric(
  { locales: [locale], source }: MessageFunctionContext,
  options: Record<string | symbol, unknown>,
  input?: unknown
): MessageValue {
  let num = NaN;
  let fd = 0;

  switch (typeof input) {
    case 'number':
      num = input;
      break;
    case 'string':
      num = Number(input);
      break;
    case 'object':
      if (typeof input?.valueOf === 'function') {
        const value = input.valueOf();
        if (typeof value === 'number') num = value;
        // @ts-expect-error Let's just do the JS thing.
        const opt = input.options as Record<string, unknown> | undefined;
        if (opt) {
          if (typeof opt.fd === 'number') fd = opt.fd;
          const lc = opt.locale;
          if (Array.isArray(lc) && typeof lc[0] === 'string') locale = lc[0];
          else if (typeof lc === 'string') locale = lc;
        }
      }
  }
  if (!Number.isFinite(num)) {
    const msg = 'Input is not numeric';
    throw new MessageResolutionError('bad-input', msg, source);
  }

  try {
    if (options?.fd !== undefined) fd = asPositiveInteger(options.fd);
    if (fd !== 0 && fd !== 1) throw new Error();
  } catch (err) {
    throw new MessageResolutionError('bad-option', 'Invalid fd value', source);
  }

  const int = Math.trunc(num);
  const fs = fd ? (Math.abs(num - int) * 10).toFixed(0) : undefined;
  return {
    type: 'test:numeric',
    source,
    locale,
    options: { fd },
    selectKey: options[NotSelectable]
      ? undefined
      : keys => {
          if (num === 1) {
            if (fd === 1 && keys.has('1.0')) return '1.0';
            if (keys.has('1')) return '1';
          }
          return null;
        },
    toParts: options[NotFormattable]
      ? undefined
      : () => {
          const parts =
            int < 0
              ? [
                  { type: 'min', value: '-' },
                  { type: 'int', value: Math.abs(int).toString() }
                ]
              : [{ type: 'int', value: int.toString() }];
          if (fs) {
            parts.push(
              { type: 'dot', value: '.' },
              { type: 'frac', value: fs }
            );
          }
          return [{ type: 'test', source, locale, parts }];
        },
    toString: options[NotFormattable]
      ? undefined
      : () => (fs ? `${int}.${fs}` : int.toString()),
    valueOf: () => num
  };
}

export const testFormat = (
  ctx: MessageFunctionContext,
  options: Record<string | symbol, unknown>,
  input?: unknown
) => testNumeric(ctx, { ...options, [NotSelectable]: true }, input);

export const testSelect = (
  ctx: MessageFunctionContext,
  options: Record<string | symbol, unknown>,
  input?: unknown
) => testNumeric(ctx, { ...options, [NotFormattable]: true }, input);
