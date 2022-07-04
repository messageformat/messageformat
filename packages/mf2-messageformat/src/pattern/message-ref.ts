import type { PatternElement } from '../data-model';
import type { Context } from '../format-context';
import { MessageFallback } from '../message-value';
import type { MessageFormat } from '../messageformat';
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
  msg_id: string;
  scope?: Record<string, Literal | VariableRef>;
}

interface MsgRefContext extends Context {
  types: {
    term: MessageFormat['getMessage'];
    variable: Scope;
  };
}

const isMsgRefContext = (ctx: Context): ctx is MsgRefContext =>
  typeof ctx.types.term === 'function';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMessageRef = (part: any): part is MessageRef =>
  !!part && typeof part === 'object' && part.type === 'term';

function getMessageScope(ctx: MsgRefContext, { scope }: MessageRef): Scope {
  const res: Scope = {};
  if (scope) {
    for (const [key, value] of Object.entries(scope)) {
      res[key] = ctx.resolve(value);
    }
  }
  return res;
}

export const resolver: PatternElementResolver<MessageFormat['getMessage']> = {
  type: 'term',

  initContext: mf => mf.getMessage.bind(mf),

  resolve(ctx, term: MessageRef) {
    const source = '-' + term.msg_id;

    if (isMsgRefContext(ctx)) {
      const msgScope = getMessageScope(ctx, term);
      const msg = ctx.types.term(term.msg_id, msgScope);
      if (msg) {
        msg.source = source;
        return msg;
      }
    }

    const fb = new MessageFallback(ctx, { source });
    ctx.onError(new Error(`Message not available: ${source}`), fb);
    return fb;
  }
};
