import { Context } from '../format-context';
import { MessageFallback } from '../message-value';

/**
 * When the parser encounters an error, it may emit a Junk pattern element to
 * represent it.
 *
 * Garbage in, garbage out: Resolving a message that includes junk will always
 * resolve it using a fallback representation.
 */
export interface Junk {
  type: 'junk';
  source: string;
  name?: never;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isJunk = (part: any): part is Junk =>
  !!part && typeof part === 'object' && part.type === 'junk';

export function resolveJunk(ctx: Context, { source }: Junk) {
  const fb = new MessageFallback(ctx, { source });
  ctx.onError(new Error('Junk pattern element cannot be resolved'), fb);
  return fb;
}
