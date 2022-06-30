import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { MessageElement, MessageFallback } from '../message-value';
import type { Literal, PatternElementResolver, VariableRef } from './index';

export interface Element extends PatternElement {
  type: 'element';
  name: string;
  tag: 'start' | 'end';
  options?: Record<string, Literal | VariableRef>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isElement = (part: any): part is Element =>
  !!part && typeof part === 'object' && part.type === 'element';

function resolveOptions(
  ctx: Context,
  options: Record<string, Literal | VariableRef> | undefined
) {
  const opt: Record<string, unknown> = {};
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      opt[key] = ctx.resolve(value).value;
    }
  }
  return opt;
}

export const resolver: PatternElementResolver<never> = {
  type: 'element',

  resolve(ctx, { name, options, tag }: Element) {
    const source = tag === 'end' ? `</${name}>` : `<${name}>`;
    try {
      return new MessageElement(ctx, name, {
        options: resolveOptions(ctx, options),
        source,
        tag
      });
    } catch (error) {
      const fb = new MessageFallback(ctx, { source });
      ctx.onError(error, fb);
      return fb;
    }
  }
};
