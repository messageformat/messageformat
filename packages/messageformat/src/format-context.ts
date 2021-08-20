import { isMessage, Message, PatternElement } from './data-model';
import type { FormattedPart } from './formatted-part';
import type { MessageFormat } from './messageformat';
import { PatternFormatter } from './pattern';
import type { Scope } from './pattern/variable';
import type { Runtime } from './runtime';

export interface Context {
  formatAsPart(part: PatternElement): FormattedPart;
  formatAsString(part: PatternElement): string;
  formatAsValue(part: PatternElement): unknown;
  getMessage(resId: string | undefined, msgPath: string[]): Message | null;
  locales: string[];
  runtime: Runtime;
  scope: Scope;
}

export function createContext<R>(
  mf: MessageFormat<R>,
  patternHandlers: Record<string, PatternFormatter>,
  resId: string,
  scope: Scope
): Context {
  const getFormatter = ({ type }: PatternElement) => {
    const fmt = patternHandlers[type];
    if (fmt) return fmt;
    throw new Error(`Unsupported pattern element: ${type}`);
  };
  return {
    formatAsPart(part) {
      return getFormatter(part).formatAsPart(this, part);
    },
    formatAsString(part) {
      return getFormatter(part).formatAsString(this, part);
    },
    formatAsValue(part) {
      return getFormatter(part).formatAsValue(this, part);
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
