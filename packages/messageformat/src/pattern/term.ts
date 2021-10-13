import type { Message, PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { asFormattable, FormattableMessage } from '../formattable';
import { MessageFormatPart } from '../formatted-part';
import type { Literal, PatternFormatter, Variable } from './index';
import { getArgSource } from './util-arg-source';
import type { Scope } from './variable';

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
  types: {
    term(resId: string | undefined, msgPath: string[]): Message | undefined;
    variable: Scope;
  };
}

const isTermContext = (ctx: Context): ctx is TermContext =>
  typeof ctx.types.term === 'function';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isTerm = (part: any): part is Term =>
  !!part && typeof part === 'object' && part.type === 'term';

function formatTermToParts(ctx: Context, term: Term): MessageFormatPart[] {
  const fmtMsg = getFormattableMessage(ctx, term);
  const source = getSource(term);
  const res: MessageFormatPart[] = fmtMsg
    ? fmtMsg.toParts(ctx.locales, ctx.localeMatcher, source)
    : [{ type: 'fallback', value: fallbackValue(ctx, term), source }];
  if (term.meta)
    res.unshift({ type: 'meta', value: '', meta: { ...term.meta }, source });
  return res;
}

function getSource({ msg_path, res_id }: Term) {
  const name = msg_path.map(getArgSource).join('.');
  return res_id ? `-${res_id}::${name}` : `-${name}`;
}

function getFormattableMessage(
  ctx: Context,
  { msg_path, res_id, scope }: Term
) {
  if (!isTermContext(ctx)) return null;
  const strPath = msg_path.map(elem =>
    ctx.getFormatter(elem).formatToString(ctx, elem)
  );
  const msg = ctx.types.term(res_id, strPath);
  if (!msg) return null;

  let msgCtx = ctx;
  if (res_id || scope) {
    const types: TermContext['types'] = { ...ctx.types };
    if (res_id)
      types.term = (msgResId, msgPath) =>
        ctx.types.term(msgResId || res_id, msgPath);
    if (scope) {
      // If the variable type isn't actually available, this has no effect
      types.variable = { ...ctx.types.variable };
      for (const [key, value] of Object.entries(scope))
        types.variable[key] = ctx.getFormatter(value).asFormattable(ctx, value);
    }
    msgCtx = { ...ctx, types };
  }

  return new FormattableMessage(msgCtx, msg);
}

function fallbackValue(ctx: Context, term: Term): string {
  const resolve = (v: Literal | Variable) =>
    ctx.getFormatter(v).asFormattable(ctx, v).getValue();
  let name = term.msg_path.map(resolve).join('.');
  if (term.res_id) name = term.res_id + '::' + name;
  if (!term.scope) return '-' + name;
  const scope = Object.entries(term.scope).map(
    ([key, value]) => `${key}: ${resolve(value)}`
  );
  return `-${name}(${scope.join(', ')})`;
}

export const formatter: PatternFormatter<TermContext['types']['term']> = {
  type: 'term',
  asFormattable: (ctx, term: Term) =>
    getFormattableMessage(ctx, term) ?? asFormattable(undefined),
  formatToParts: formatTermToParts,
  formatToString: (ctx, term: Term) =>
    getFormattableMessage(ctx, term)?.toString() ??
    '{' + fallbackValue(ctx, term) + '}',
  initContext: (mf, resId) => (msgResId, msgPath) =>
    mf.getMessage(msgResId || resId, msgPath)
};
