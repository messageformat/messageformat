import { MessageResolutionError } from '../errors.ts';
import type { Context } from '../format-context.ts';
import type { MessageMarkupPart } from '../formatted-parts.ts';
import { getValueSource, resolveValue } from './resolve-value.ts';
import type { Markup } from '../data-model/types.ts';

export function formatMarkup(
  ctx: Context,
  { kind, name, options }: Markup
): MessageMarkupPart {
  const source =
    kind === 'close' ? `/${name}` : kind === 'open' ? `#${name}` : `#${name}/`;
  const part: MessageMarkupPart = { type: 'markup', kind, source, name };
  if (options?.size) {
    part.options = {};
    for (const [name, value] of options) {
      if (name === 'u:dir' || name === 'u:locale') {
        const msg = `The option ${name} is not valid for markup`;
        const optSource = getValueSource(value);
        ctx.onError(new MessageResolutionError('bad-option', msg, optSource));
      } else {
        let rv = resolveValue(ctx, value);
        if (typeof rv === 'object' && typeof rv?.valueOf === 'function') {
          rv = rv.valueOf();
        }
        if (name === 'u:id') part.id = String(rv);
        else part.options[name] = rv;
      }
    }
  }
  return part;
}
