import {
  isMessage,
  Message,
  MessageGroup,
  PatternElement,
  Resource
} from './data-model';
import type { Context } from './format-context';
import { formatToParts, formatToString } from './format-message';
import { MessageFormatPart } from './formatted-part';
import { PatternFormatter, patternFormatters } from './pattern';
import type { Scope } from './pattern/variable';
import { defaultRuntime, Runtime } from './runtime';

function getEntry<P extends PatternElement>(res: Resource<P>, path: string[]) {
  let msg: Resource<P> | MessageGroup<P> | Message<P> = res;
  for (const part of path) {
    if (!msg || msg.type === 'message' || msg.type === 'select')
      return undefined;
    msg = msg.entries[part];
  }
  return msg;
}

export interface MessageFormatOptions {
  formatters?: (
    | 'function'
    | 'literal'
    | 'term'
    | 'variable'
    | PatternFormatter
  )[];
  localeMatcher?: 'best fit' | 'lookup';
  runtime?: Runtime;
}

/**
 * Create a new message formatter.
 *
 * If `runtime` is unset, a default minimal set is used, consisting of `plural`
 * for selection and `datetime` & `number` formatters based on the `Intl`
 * equivalents.
 */
export class MessageFormat {
  #formatters: PatternFormatter[];
  #localeMatcher: 'best fit' | 'lookup';
  #locales: string[];
  #resources: Resource[];
  #runtime: Readonly<Runtime>;

  constructor(
    locales: string | string[],
    options?: MessageFormatOptions | null,
    ...resources: Resource[]
  ) {
    this.#formatters =
      options?.formatters?.map(fmtOpt => {
        if (typeof fmtOpt === 'string') {
          const fmt = patternFormatters.find(fmt => fmt.type === fmtOpt);
          if (!fmt) throw new RangeError(`Unsupported pattern type: ${fmtOpt}`);
          return fmt;
        } else return fmtOpt;
      }) ?? patternFormatters;
    this.#localeMatcher = options?.localeMatcher ?? 'best fit';
    this.#locales = Array.isArray(locales) ? locales : [locales];
    this.#resources = resources;
    this.#runtime = options?.runtime ?? defaultRuntime;
  }

  addResources(...resources: Resource[]) {
    this.#resources.splice(0, 0, ...resources);
  }

  format(msgPath: string | string[], scope?: Scope): string;
  format(resId: string, msgPath: string | string[], scope?: Scope): string;
  format(
    arg0: string | string[],
    arg1?: string | string[] | Scope,
    arg2?: Scope
  ) {
    const { resId, msgPath, scope } = this.parseArgs(arg0, arg1, arg2);
    const msg = this.getEntry(resId, msgPath);
    let res = '';
    if (isMessage(msg)) {
      const ctx = this.createContext(resId, scope);
      for (const fs of formatToString(ctx, msg)) res += fs;
    }
    return res;
  }

  formatToParts(msgPath: string | string[], scope?: Scope): MessageFormatPart[];
  formatToParts(
    resId: string,
    msgPath: string | string[],
    scope?: Scope
  ): MessageFormatPart[];
  formatToParts(
    arg0: string | string[],
    arg1?: string | string[] | Scope,
    arg2?: Scope
  ) {
    const { resId, msgPath, scope } = this.parseArgs(arg0, arg1, arg2);
    const msg = this.getEntry(resId, msgPath);
    return isMessage(msg)
      ? formatToParts(this.createContext(resId, scope), msg)
      : [];
  }

  getEntry(resId: string, path: string | string[]) {
    const p = Array.isArray(path) ? path : [path];
    for (const res of this.#resources) {
      if (res.id === resId) {
        const msg = getEntry(res, p);
        if (msg !== undefined) return msg;
      }
    }
    return undefined;
  }

  getResources(): Iterable<Readonly<Resource>> {
    return this.#resources;
  }

  resolvedOptions() {
    return {
      localeMatcher: this.#localeMatcher,
      locales: this.#locales.slice(),
      runtime: this.#runtime
    };
  }

  private createContext(resId: string, scope: Scope): Context {
    const getFormatter = ({ type }: PatternElement) => {
      const fmt = this.#formatters.find(fmt => fmt.type === type);
      if (fmt) return fmt;
      throw new Error(`Unsupported pattern element: ${type}`);
    };

    const ctx: Context = {
      formatToParts(part) {
        return getFormatter(part).formatToParts(this, part);
      },
      formatToString(part) {
        return getFormatter(part).formatToString(this, part);
      },
      formatToValue(part, formattable) {
        return getFormatter(part).formatToValue(this, part, formattable);
      },
      localeMatcher: this.#localeMatcher,
      locales: this.#locales,
      stringify: value =>
        value && typeof value.toLocaleString === 'function'
          ? value.toLocaleString(this.#locales, {
              localeMatcher: this.#localeMatcher
            })
          : String(value),
      types: {}
    };

    for (const fmt of this.#formatters) {
      if (typeof fmt.initContext === 'function')
        ctx.types[fmt.type] = fmt.initContext(this, resId, scope);
    }

    return ctx;
  }

  private parseArgs(
    arg0: string | string[],
    arg1?: string | string[] | Scope,
    arg2?: Scope
  ) {
    if (typeof arg1 === 'string' || Array.isArray(arg1)) {
      if (typeof arg0 !== 'string')
        throw new Error(`Invalid resId argument: ${arg0}`);
      return {
        resId: arg0,
        msgPath: Array.isArray(arg1) ? arg1 : [arg1],
        scope: arg2 || {}
      };
    } else {
      const r0 = this.#resources[0];
      if (!r0) throw new Error('No resources available');
      const resId = r0.id;
      for (const res of this.#resources)
        if (res.id !== resId)
          throw new Error(
            'Explicit resource id required to differentiate resources'
          );
      return {
        resId,
        msgPath: Array.isArray(arg0) ? arg0 : [arg0],
        scope: arg1 || {}
      };
    }
  }
}
