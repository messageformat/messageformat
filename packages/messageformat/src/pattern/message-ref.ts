import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { MessageFallback, ResolvedMessage } from '../message-value';
import type { Literal, PatternElementResolver, VariableRef } from './index';
import type { Scope } from './variable-ref';

/**
 * A MessageRef is a pointer to a Message or a Select.
 *
 * If `res_id` is undefined, the message is sought in the current Resource.
 * If it is set, it identifies the resource for the sought message. It is
 * entirely intentional that this value may not be defined at runtime.
 * `msg_path` is used to locate the Message within the Resource, and it may
 * include Variable values.
 *
 * `scope` overrides values in the current scope when resolving the message.
 */
export interface MessageRef extends PatternElement {
  type: 'term';
  res_id?: string;
  msg_path: (Literal | VariableRef)[];
  scope?: Record<string, Literal | VariableRef>;
}

type MsgRefResolver = (
  resId: string | undefined,
  msgPath: string[],
  scope?: Scope
) => ResolvedMessage | undefined;

interface MsgRefContext extends Context {
  types: {
    term: MsgRefResolver;
    variable: Scope;
  };
}

const isMsgRefContext = (ctx: Context): ctx is MsgRefContext =>
  typeof ctx.types.term === 'function';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMessageRef = (part: any): part is MessageRef =>
  !!part && typeof part === 'object' && part.type === 'term';

function getMessageScope(ctx: MsgRefContext, { scope }: MessageRef): Scope {
  if (!scope) return ctx.types.variable;
  const res = { ...ctx.types.variable };
  for (const [key, value] of Object.entries(scope))
    res[key] = ctx.resolve(value);
  return res;
}

export const resolver: PatternElementResolver<MsgRefResolver> = {
  type: 'term',

  initContext: (mf, resId) => (msgResId, path, scope) => {
    const res = mf.getMessage({ resId: msgResId || resId, path }, scope);
    if (res) res.source = '-' + path.join('.');
    return res;
  },

  resolve(ctx, term: MessageRef) {
    const { meta, msg_path, res_id } = term;
    const strPath = msg_path.map(elem => ctx.resolve(elem).toString());
    let source = strPath.join('.');
    source = res_id ? `-${res_id}::${source}` : `-${source}`;

    if (isMsgRefContext(ctx)) {
      const msgScope = getMessageScope(ctx, term);
      const msg = ctx.types.term(res_id, strPath, msgScope);
      if (msg) return msg;
    }

    return new MessageFallback(ctx, meta, { source });
  }
};
