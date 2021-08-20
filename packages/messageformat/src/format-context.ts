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
