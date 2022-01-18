import type { Message, PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { FormattableFallback, FormattableMessage } from '../formattable';
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

function getMessageContext(ctx: TermContext, { res_id, scope }: Term) {
  if (!res_id && !scope) return ctx;

  const types: TermContext['types'] = { ...ctx.types };

  if (res_id) {
    types.term = (msgResId, msgPath) =>
      ctx.types.term(msgResId || res_id, msgPath);
  }

  if (scope) {
    // If the variable type isn't actually available, this has no effect
    types.variable = { ...ctx.types.variable };
    for (const [key, value] of Object.entries(scope))
      types.variable[key] = ctx.resolve(value);
  }

  return { ...ctx, types };
}

export const formatter: PatternFormatter<TermContext['types']['term']> = {
  type: 'term',

  initContext: (mf, resId) => (msgResId, msgPath) =>
    mf.getMessage(msgResId || resId, msgPath),

  resolve(ctx, term: Term) {
    const { meta, msg_path, res_id } = term;
    const strPath = msg_path.map(elem => ctx.resolve(elem).toString());
    let source = strPath.join('.');
    source = res_id ? `-${res_id}::${source}` : `-${source}`;

    if (isTermContext(ctx)) {
      const msg = ctx.types.term(res_id, strPath);
      if (msg) {
        const msgCtx = getMessageContext(ctx, term);
        return new FormattableMessage(msgCtx, msg, source);
      }
    }

    return new FormattableFallback(ctx, meta, { source });
  }
};
