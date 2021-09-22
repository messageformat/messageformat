import { PatternElement, Resource } from './data-model';
import type { Context } from './format-context';
import { FormattableMessage } from './formattable';
import { MessageFormatPart } from './formatted-part';
import { PatternFormatter, patternFormatters } from './pattern';
import type { Scope } from './pattern/variable';
import { ResourceReader } from './resource-reader';
import { defaultRuntime, Runtime } from './runtime';

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
  #resources: ResourceReader[];
  #runtime: Readonly<Runtime>;

  constructor(
    locales: string | string[],
    options?: MessageFormatOptions | null,
    ...resources: (Resource | ResourceReader)[]
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
    this.#resources = resources.map(ResourceReader.from);
    this.#runtime = options?.runtime ?? defaultRuntime;
  }

  addResources(...resources: (Resource | ResourceReader)[]) {
    this.#resources.splice(0, 0, ...resources.map(ResourceReader.from));
  }

  format(msgPath: string | string[], scope?: Scope): string;
  format(resId: string, msgPath: string | string[], scope?: Scope): string;
  format(
    arg0: string | string[],
    arg1?: string | string[] | Scope,
    arg2?: Scope
  ) {
    const fmtMsg = this.getFormattableMessage(
      ...this.parseArgs(arg0, arg1, arg2)
    );
    return fmtMsg ? fmtMsg.toString() : '';
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
    const fmtMsg = this.getFormattableMessage(
      ...this.parseArgs(arg0, arg1, arg2)
    );
    return fmtMsg ? fmtMsg.toParts() : [];
  }

  getMessage(resId: string, path: string | string[]) {
    const p = Array.isArray(path) ? path : [path];
    for (const res of this.#resources) {
      if (res.getId() === resId) {
        const msg = res.getMessage(p);
        if (msg) return msg;
      }
    }
    return undefined;
  }

  resolvedOptions() {
    return {
      localeMatcher: this.#localeMatcher,
      locales: this.#locales.slice(),
      runtime: this.#runtime
    };
  }

  private getFormattableMessage(
    resId: string,
    msgPath: string | string[],
    scope: Scope
  ) {
    const msg = this.getMessage(resId, msgPath);
    if (!msg) return null;
    const ctx = this.createContext(resId, scope);
    return new FormattableMessage(ctx, msg);
  }

  private createContext(resId: string, scope: Scope): Context {
    const getFormatter = ({ type }: PatternElement) => {
      const fmt = this.#formatters.find(fmt => fmt.type === type);
      if (fmt) return fmt;
      throw new Error(`Unsupported pattern element: ${type}`);
    };

    const ctx: Context = {
      getFormatter,
      localeMatcher: this.#localeMatcher,
      locales: this.#locales,
      types: {}
    };

    for (const fmt of this.#formatters) {
      if (typeof fmt.initContext === 'function')
        ctx.types[fmt.type] = fmt.initContext(this, resId, scope);
    }

    return ctx;
  }

  private parseArgs(
    ...args: [
      string | string[],
      string | string[] | Scope | undefined,
      Scope | undefined
    ]
  ): [string, string | string[], Scope] {
    let resId: string;
    let msgPath: string | string[];
    let scope: Scope | undefined;

    if (typeof args[1] === 'string' || Array.isArray(args[1])) {
      // (resId: string, msgPath: string | string[], scope?: Scope)
      if (typeof args[0] !== 'string')
        throw new Error(`Invalid resId argument: ${args[0]}`);
      [resId, msgPath, scope] = args;
    } else {
      // (msgPath: string | string[], scope?: Scope)
      const r0 = this.#resources[0];
      if (!r0) throw new Error('No resources available');
      const id0 = r0.getId();
      for (const res of this.#resources)
        if (res.getId() !== id0)
          throw new Error(
            'Explicit resource id required to differentiate resources'
          );
      resId = id0;
      [msgPath, scope] = args;
    }

    return [resId, msgPath, scope || {}];
  }
}
