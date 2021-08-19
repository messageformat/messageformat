import { isMessage, Message, PatternElement } from './data-model';
import type { MessageFormat } from './messageformat';
import type { Runtime, Scope } from './runtime';

export interface Context<R, S> {
  getMessage(
    resId: string | undefined,
    msgPath: string[]
  ): Message<PatternElement> | null;
  locales: string[];
  runtime: Runtime<R>;
  scope: Scope<S>;
  select?: boolean;
}

export function createContext<R, S>(
  mf: MessageFormat<R>,
  resId: string,
  scope: Scope<S>
): Context<R, S> {
  return {
    getMessage: (msgResId, msgPath) => {
      const msg = mf.getEntry(msgResId || resId, msgPath);
      return isMessage(msg) ? msg : null;
    },
    locales: mf.locales,
    runtime: mf.runtime,
    scope
  };
}

export function extendContext<R, S>(
  prev: Context<R, S>,
  resId: string | undefined,
  scope: Scope<S> | undefined
): Context<R, S> {
  const ctx = Object.assign({}, prev);
  delete ctx.select;
  if (resId)
    ctx.getMessage = (msgResId, msgPath) =>
      prev.getMessage(msgResId || resId, msgPath);
  if (scope) ctx.scope = scope;
  return ctx;
}
