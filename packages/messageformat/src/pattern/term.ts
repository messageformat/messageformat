import type { Message, PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { formatToParts, formatToString } from '../format-message';
import { argumentSource, MessageFormatPart } from '../formatted-part';
import type { Literal, PatternFormatter, Variable } from './index';
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

export function formatTermToParts(
  ctx: Context,
  term: Term
): MessageFormatPart[] {
  const msg = getMessage(ctx, term);
  const source = getSource(term);
  let res: MessageFormatPart[];
  if (msg) {
    const msgCtx = extendContext(ctx, term);
    res = formatToParts(msgCtx, msg);
    for (const fmt of res) {
      fmt.source = fmt.source ? source + '/' + fmt.source : source;
      if (term.meta) fmt.meta = { ...term.meta, ...fmt.meta };
    }
  } else {
    res = [{ type: 'fallback', value: fallbackValue(ctx, term), source }];
    if (term.meta) res[0].meta = { ...term.meta };
  }
  return res;
}

function getSource({ msg_path, res_id }: Term) {
  const name = msg_path.map(argumentSource).join('.');
  return res_id ? `-${res_id}::${name}` : `-${name}`;
}

export const formatTermToString = (ctx: Context, term: Term): string =>
  formatTermToValue(ctx, term) ?? '{' + fallbackValue(ctx, term) + '}';

export function formatTermToValue(
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
  const strPath = msg_path.map(part => ctx.formatToString(part));
  return isTermContext(ctx) ? ctx.types.term(res_id, strPath) : null;
}

function extendContext(ctx: Context, { res_id, scope }: Term): Context {
  if (isTermContext(ctx) && (res_id || scope)) {
    const types: TermContext['types'] = { ...ctx.types };
    if (res_id)
      types.term = (msgResId, msgPath) =>
        ctx.types.term(msgResId || res_id, msgPath);
    if (scope) {
      // If the variable type isn't actually available, this has no effect
      types.variable = { ...ctx.types.variable };
      for (const [key, value] of Object.entries(scope))
        types.variable[key] = ctx.formatToValue(value);
    }
    return { ...ctx, types };
  } else return ctx;
}

function fallbackValue(ctx: Context, term: Term): string {
  const resolve = (v: Literal | Variable) => ctx.formatToString(v);
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
  formatToParts: formatTermToParts,
  formatToString: formatTermToString,
  formatToValue: formatTermToValue,
  initContext: (mf, resId) => (msgResId, msgPath) =>
    mf.getMessage(msgResId || resId, msgPath)
};
