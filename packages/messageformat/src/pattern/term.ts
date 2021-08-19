import { PatternElement } from '../data-model';
import { Context, extendContext } from '../format-context';
import {
  FormattedFallback,
  FormattedMessage,
  formatToParts,
  resolveOptions,
  resolvePart
} from '../format-message';
import type { Literal } from './literal';
import type { Variable } from './variable';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isTerm = (part: any): part is Term =>
  !!part && typeof part === 'object' && part.type === 'term';

export function resolveTerm<R, S>(
  ctx: Context<R, S>,
  term: Term
): FormattedMessage<R | S | string> | FormattedFallback {
  const { msg_path, res_id, scope } = term;
  const strPath = msg_path.map(part => String(resolvePart(ctx, part)));
  const msg = ctx.getMessage(res_id, strPath);
  if (!msg) {
    const fb = fallbackValue(ctx, term);
    return new FormattedFallback(ctx.locales, fb, term.meta);
  }
  if (res_id || scope) {
    const opt = scope ? resolveOptions(ctx, scope, 'any') : null;
    const msgScope = Object.assign({}, ctx.scope, opt);
    // Let's not check typings of Term scope overrides
    ctx = extendContext(ctx, res_id, msgScope) as Context<R, S>;
  }
  return new FormattedMessage(ctx.locales, formatToParts(ctx, msg), term.meta);
}

function fallbackValue(ctx: Context<unknown, unknown>, term: Term): string {
  const resolve = (v: Literal | Variable) => resolvePart(ctx, v).valueOf();
  let name = term.msg_path.map(resolve).join('.');
  if (term.res_id) name = term.res_id + '::' + name;
  if (!term.scope) return '-' + name;
  const scope = Object.entries(term.scope).map(
    ([key, value]) => `${key}: ${resolve(value)}`
  );
  return `-${name}(${scope.join(', ')})`;
}
