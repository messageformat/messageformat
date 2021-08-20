import { isMessage, Message } from './data-model';
import type { MessageFormat } from './messageformat';
import type { Scope } from './pattern/variable';
import type { Runtime } from './runtime';

export interface Context {
  getMessage(resId: string | undefined, msgPath: string[]): Message | null;
  locales: string[];
  runtime: Runtime;
  scope: Scope;
}

export function createContext<R>(
  mf: MessageFormat<R>,
  resId: string,
  scope: Scope
): Context {
  return {
    getMessage(msgResId, msgPath) {
      const msg = mf.getEntry(msgResId || resId, msgPath);
      return isMessage(msg) ? msg : null;
    },
    locales: mf.locales,
    runtime: mf.runtime,
    scope
  };
}

export function extendContext(
  prev: Context,
  resId: string | undefined,
  scope: Scope | undefined
): Context {
  const ctx = Object.assign({}, prev);
  if (resId)
    ctx.getMessage = (msgResId, msgPath) =>
      prev.getMessage(msgResId || resId, msgPath);
  if (scope) ctx.scope = scope;
  return ctx;
}
