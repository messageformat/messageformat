import { isMessage, Message, PatternElement } from './data-model';
import type { FormattedPart } from './formatted-part';
import type { MessageFormat } from './messageformat';
import { PatternHandler } from './pattern';
import type { Scope } from './pattern/variable';
import type { Runtime } from './runtime';

export interface Context {
  formatPart(part: PatternElement): FormattedPart;
  getMessage(resId: string | undefined, msgPath: string[]): Message | null;
  locales: string[];
  runtime: Runtime;
  scope: Scope;
}

export function createContext<R>(
  mf: MessageFormat<R>,
  patternHandlers: Record<string, PatternHandler>,
  resId: string,
  scope: Scope
): Context {
  return {
    formatPart(part) {
      const handler = patternHandlers[part.type];
      if (handler) return handler.resolve(this, part);
      /* istanbul ignore next - never happens */
      throw new Error(`Unsupported pattern element: ${part}`);
    },
    getMessage(msgResId, msgPath) {
      const msg = mf.getEntry(msgResId || resId, msgPath);
      return isMessage(msg) ? msg : null;
    },
    locales: mf.locales,
    runtime: mf.runtime,
    scope
  };
}
