import { isMessage, Message, PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { formatToParts, formatToString } from '../format-message';
import { FormattedFallback, FormattedMessage } from '../formatted-part';
import { resolveOptions } from './function';
import type { PatternFormatter } from './index';
import type { Literal } from './literal';
import { resolveArgument, Variable } from './variable';

/**
 * A Term is a pointer to a Message or a Select.
 *
 * If `res_id` is undefined, the message is sought in the current Resource.
 * If it is set, it identifies the resource for the sought message. It is
 * entirely intentional that this value may not be defined at runtime.
 * `msg_path` is used to locate the Message within the Resource, and it may
 * include Variable values.
 *
 * `scope` overrides values in the current scope when resolving the message.
 */
export interface Term extends PatternElement {
  type: 'term';
  res_id?: string;
  msg_path: (Literal | Variable)[];
  scope?: Record<string, Literal | Variable>;
}

interface TermContext extends Context {
  term: {
    get(resId: string | undefined, msgPath: string[]): Message | null;
  };
}

const isTermContext = (ctx: Context): ctx is TermContext =>
  typeof ctx.term === 'object' && !!ctx.term;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isTerm = (part: any): part is Term =>
  !!part && typeof part === 'object' && part.type === 'term';

export function formatTermAsPart(
  ctx: Context,
  term: Term
): FormattedMessage | FormattedFallback {
  const msg = getMessage(ctx, term);
  if (msg) {
    const msgCtx = extendContext(ctx, term);
    const fmt = formatToParts(msgCtx, msg);
    return new FormattedMessage(ctx.locales, fmt, term.meta);
  } else {
    const fb = fallbackValue(ctx, term);
    return new FormattedFallback(ctx.locales, fb, term.meta);
  }
}

export const formatTermAsString = (ctx: Context, term: Term): string =>
  formatTermAsValue(ctx, term) ?? '{' + fallbackValue(ctx, term) + '}';

export function formatTermAsValue(
  ctx: Context,
  term: Term
): string | undefined {
  const msg = getMessage(ctx, term);
  if (msg) {
    const msgCtx = extendContext(ctx, term);
    return formatToString(msgCtx, msg);
  } else return undefined;
}

function getMessage(ctx: Context, { msg_path, res_id }: Term) {
  const strPath = msg_path.map(part => String(resolveArgument(ctx, part)));
  return isTermContext(ctx) ? ctx.term.get(res_id, strPath) : null;
}

function extendContext(prev: Context, { res_id, scope }: Term): Context {
  if (isTermContext(prev) && (res_id || scope)) {
    const ctx = Object.assign({}, prev);
    if (res_id)
      ctx.term.get = (msgResId, msgPath) =>
        prev.term.get(msgResId || res_id, msgPath);
    if (scope)
      ctx.scope = Object.assign(
        {},
        ctx.scope,
        resolveOptions(ctx, scope, 'any')
      );
    return ctx;
  } else return prev;
}

function fallbackValue(ctx: Context, term: Term): string {
  const resolve = (v: Literal | Variable) => ctx.formatAsPart(v).valueOf();
  let name = term.msg_path.map(resolve).join('.');
  if (term.res_id) name = term.res_id + '::' + name;
  if (!term.scope) return '-' + name;
  const scope = Object.entries(term.scope).map(
    ([key, value]) => `${key}: ${resolve(value)}`
  );
  return `-${name}(${scope.join(', ')})`;
}

export const formatter: PatternFormatter = {
  type: 'term',
  formatAsPart: formatTermAsPart,
  formatAsString: formatTermAsString,
  formatAsValue: formatTermAsValue,
  initContext: (mf, resId) =>
    <TermContext['term']>{
      get(msgResId, msgPath) {
        const msg = mf.getEntry(msgResId || resId, msgPath);
        return isMessage(msg) ? msg : null;
      }
    }
};
