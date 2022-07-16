import type { Context } from '../format-context';
import { MessageMarkup, MessageFallback } from '../message-value';
import type { Option } from './index';

/**
 * An element indicating the start of a span of further elements
 * that should have some markup applied to them.
 *
 * @beta
 */
export interface MarkupStart {
  type: 'markup-start';
  name: string;
  options?: Option[];
}

/**
 * An element indicating the end of a span of elements,
 * starting from the most recent {@link MarkupStart} that has the same `name`.
 *
 * @beta
 */
export interface MarkupEnd {
  type: 'markup-end';
  name: string;
}

/**
 * Type guard for {@link MarkupStart} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMarkupStart = (part: any): part is MarkupStart =>
  !!part && typeof part === 'object' && part.type === 'markup-start';

/**
 * Type guard for {@link MarkupEnd} pattern elements
 *
 * @beta
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMarkupEnd = (part: any): part is MarkupEnd =>
  !!part && typeof part === 'object' && part.type === 'markup-end';

function resolveOptions(ctx: Context, options: Option[] | undefined) {
  const opt: Record<string, unknown> = {};
  if (options) {
    for (const { name, value } of options) {
      opt[name] = ctx.resolve(value).value;
    }
  }
  return opt;
}

export function resolveMarkupStart(
  ctx: Context,
  { name, options }: MarkupStart
) {
  const source = `<${name}>`;
  try {
    return new MessageMarkup(ctx, name, {
      options: resolveOptions(ctx, options),
      source,
      tag: 'start'
    });
  } catch (error) {
    const fb = new MessageFallback(ctx, { source });
    ctx.onError(error, fb);
    return fb;
  }
}

export function resolveMarkupEnd(ctx: Context, { name }: MarkupEnd) {
  return new MessageMarkup(ctx, name, { source: `</${name}>`, tag: 'end' });
}
