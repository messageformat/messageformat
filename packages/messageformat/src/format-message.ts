import {
  isSelectMessage,
  Message,
  PatternElement,
  SelectMessage,
  Selector
} from './data-model';
import { FormattedSelectMeta, getFormattedSelectMeta } from './detect-grammar';
import type { Context } from './format-context';
import {
  addMeta,
  FormattedDynamic,
  FormattedFallback,
  FormattedLiteral,
  FormattedMessage,
  FormattedPart
} from './formatted-part';
import { isFunction, resolveFunction } from './pattern/function';
import { isLiteral, resolveLiteral } from './pattern/literal';
import { isTerm, resolveTerm } from './pattern/term';
import { isVariable, resolveVariable } from './pattern/variable';

export function formatToParts<R, S>(
  ctx: Context,
  msg: Message
): FormattedPart<R | S | string>[] {
  let fsm: FormattedSelectMeta | null = null;
  const pattern = isSelectMessage(msg)
    ? resolveSelect(ctx, msg, _fsm => (fsm = _fsm))
    : msg.value;
  const res = pattern.map(part => resolvePart<R, S>(ctx, part));
  if (msg.meta || fsm) {
    const fm = new FormattedMessage<R | S | string>(ctx.locales, res, msg.meta);
    if (fsm) addMeta(fm, fsm);
    return [fm];
  } else return res;
}

export function resolvePart<R, S>(
  ctx: Context,
  part: PatternElement
):
  | FormattedDynamic<R | S>
  | FormattedFallback
  | FormattedLiteral
  | FormattedMessage<R | S | string> {
  if (isLiteral(part)) return resolveLiteral(ctx, part);
  if (isVariable(part)) return resolveVariable(ctx, part);
  if (isFunction(part)) return resolveFunction(ctx, part);
  if (isTerm(part)) return resolveTerm(ctx, part);
  /* istanbul ignore next - never happens */
  throw new Error(`Unsupported part: ${part}`);
}

function resolveSelect(
  ctx: Context,
  select: SelectMessage,
  onMeta?: (meta: FormattedSelectMeta) => void
): PatternElement[] {
  const res = select.select.map(s => ({
    value: resolveSelectorValue(ctx, s),
    default: s.default || 'other'
  }));

  for (const { key, value } of select.cases) {
    if (
      key.every((k, i) => {
        const r = res[i];
        return k === r.default || r.value.includes(k);
      })
    ) {
      if (onMeta) {
        const meta = getFormattedSelectMeta(select, res, key);
        if (meta) onMeta(meta);
      }
      return value;
    }
  }
  return [];
}

function resolveSelectorValue(ctx: Context, { value }: Selector): string[] {
  let res = resolvePart(ctx, value).valueOf();
  if (typeof res === 'number') {
    try {
      res = ctx.runtime.plural.call(ctx.locales, undefined, res);
    } catch (_) {
      // TODO: report error
    }
  }

  return Array.isArray(res) && res.every(r => typeof r === 'string')
    ? res
    : [String(res)];
}
