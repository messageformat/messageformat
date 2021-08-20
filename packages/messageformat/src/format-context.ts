import { PatternElement } from './data-model';
import type { FormattedPart } from './formatted-part';
import type { MessageFormat } from './messageformat';
import { PatternFormatter } from './pattern';
import type { Scope } from './pattern/variable';

export interface Context {
  formatAsPart(part: PatternElement): FormattedPart;
  formatAsString(part: PatternElement): string;
  formatAsValue(part: PatternElement): unknown;
  locales: string[];
  scope: Scope;
  [key: string]: unknown;
}

export function createContext<R>(
  mf: MessageFormat<R>,
  formatters: PatternFormatter[],
  resId: string,
  scope: Scope
): Context {
  const getFormatter = ({ type }: PatternElement) => {
    const fmt = formatters.find(fmt => fmt.type === type);
    if (fmt) return fmt;
    throw new Error(`Unsupported pattern element: ${type}`);
  };

  const ctx: Context = {
    formatAsPart(part) {
      return getFormatter(part).formatAsPart(this, part);
    },
    formatAsString(part) {
      return getFormatter(part).formatAsString(this, part);
    },
    formatAsValue(part) {
      return getFormatter(part).formatAsValue(this, part);
    },
    locales: mf.locales,
    scope: scope
  };

  for (const fmt of formatters) {
    if (typeof fmt.initContext === 'function')
      ctx[fmt.type] = fmt.initContext(mf, resId);
  }

  return ctx;
}
