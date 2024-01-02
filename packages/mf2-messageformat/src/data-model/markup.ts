import { resolveValue } from './expression/value.js';
import type { Context } from '../format-context.js';
import type {
  MessageMarkupClosePart,
  MessageMarkupPart
} from '../runtime/index.js';
import type { Option } from './index.js';

/**
 * Markup placeholders can span ranges of other pattern elements,
 * or represent other inline elements.
 *
 * @remarks
 * The `name` identifies the markup part,
 * which will be included in the result along with any `options`.
 *
 * When formatted to string, all markup will format as an empty string.
 * To use markup, format to parts and post-process the formatted results.
 *
 * @beta
 */
export type Markup = MarkupOpen | MarkupStandalone | MarkupClose;

export interface MarkupOpen {
  type: 'markup';
  kind: 'open';
  name: string;
  options?: Option[];
}

export interface MarkupStandalone {
  type: 'markup';
  kind: 'standalone';
  name: string;
  options?: Option[];
}

export interface MarkupClose {
  type: 'markup';
  kind: 'close';
  name: string;
  options?: never;
}

export function formatMarkup(
  ctx: Context,
  { kind, name, options }: Markup
): MessageMarkupPart | MessageMarkupClosePart {
  if (kind === 'close') {
    return { type: 'markup', kind, source: `/${name}`, name };
  }
  const source = kind === 'open' ? `#${name}` : `#${name}/`;
  const part: MessageMarkupPart = { type: 'markup', kind, source, name };
  if (options?.length) {
    part.options = {};
    for (const { name, value } of options) {
      let rv = resolveValue(ctx, value);
      if (typeof rv === 'object' && typeof rv?.valueOf === 'function') {
        const vv = rv.valueOf();
        if (vv !== rv) rv = vv;
      }
      part.options[name] = rv;
    }
  }
  return part;
}
