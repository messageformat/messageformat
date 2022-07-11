import type { Context } from '../format-context';
import { MessageMarkup, MessageFallback } from '../message-value';
import type { Option, PatternElementResolver } from './index';

export interface MarkupStart {
  type: 'markup-start';
  name: string;
  options?: Option[];
}

export interface MarkupEnd {
  type: 'markup-end';
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMarkupStart = (part: any): part is MarkupStart =>
  !!part && typeof part === 'object' && part.type === 'markup-start';

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

export const markupStartResolver: PatternElementResolver<never> = {
  type: 'markup-start',

  resolve(ctx, { name, options }: MarkupStart) {
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
};

export const markupEndResolver: PatternElementResolver<never> = {
  type: 'markup-end',

  resolve: (ctx, { name }: MarkupEnd) =>
    new MessageMarkup(ctx, name, { source: `</${name}>`, tag: 'end' })
};
