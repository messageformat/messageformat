import { Message, PatternElement, Resource } from './data-model';
import type { Context } from './format-context';
import { ResolvedMessage } from './message-value';
import { PatternElementResolver, patternFormatters } from './pattern';
import type { Scope } from './pattern/variable-ref';
import { ResourceReader } from './resource-reader';
import { defaultRuntime, Runtime } from './runtime';

export interface MessageFormatOptions {
  elements?: (
    | 'element'
    | 'function'
    | 'literal'
    | 'term'
    | 'variable'
    | PatternElementResolver
  )[];
  localeMatcher?: 'best fit' | 'lookup';
  runtime?: Runtime;
}

export const MFruntime = Symbol('runtime');

/**
 * Create a new message formatter.
 *
 * If `runtime` is unset, a default minimal set is used, consisting of `plural`
 * for selection and `datetime` & `number` formatters based on the `Intl`
 * equivalents.
 */
export class MessageFormat {
  readonly #localeMatcher: 'best fit' | 'lookup';
  readonly #locales: string[];
  readonly #resolvers: readonly PatternElementResolver[];
  readonly #resources: ResourceReader[];

  readonly [MFruntime]: Readonly<Runtime>;

  constructor(
    locales: string | string[],
    options?: MessageFormatOptions | null,
    ...resources: (Resource | ResourceReader)[]
  ) {
    this.#resolvers =
      options?.elements?.map(fmtOpt => {
        if (typeof fmtOpt === 'string') {
          const fmt = patternFormatters.find(fmt => fmt.type === fmtOpt);
          if (!fmt) throw new RangeError(`Unsupported pattern type: ${fmtOpt}`);
          return fmt;
        } else return fmtOpt;
      }) ?? patternFormatters;
    this.#localeMatcher = options?.localeMatcher ?? 'best fit';
    this.#locales = Array.isArray(locales) ? locales.slice() : [locales];
    this.#resources = resources.map(ResourceReader.from);
    const rt = options?.runtime ?? defaultRuntime;
    this[MFruntime] = Object.freeze({ ...rt });
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
    const fmtMsg = this.getMessage(...this.parseArgs(arg0, arg1, arg2));
    return fmtMsg ? fmtMsg.toString() : '';
  }

  getMessage(
    resId: string,
    msgPath: string | string[],
    scope: Scope = {}
  ): ResolvedMessage | undefined {
    let msg: Message | undefined;

    const p = Array.isArray(msgPath) ? msgPath : [msgPath];
    for (const res of this.#resources) {
      if (res.getId() === resId) {
        msg = res.getMessage(p);
        if (msg) break;
      }
    }
    if (!msg) return undefined;

    const ctx = this.createContext(resId, scope);
    return new ResolvedMessage(ctx, msg);
  }

  resolvedOptions() {
    return {
      elements: this.#resolvers.map(res => res.type),
      localeMatcher: this.#localeMatcher,
      locales: this.#locales.slice(),
      runtime: this[MFruntime]
    };
  }

  private createContext(resId: string, scope: Scope): Context {
    const resolvers = this.#resolvers;

    const ctx: Context = {
      resolve(elem: PatternElement) {
        const res = resolvers.find(res => res.type === elem.type);
        if (!res) throw new Error(`Unsupported pattern element: ${elem.type}`);
        return res.resolve(this, elem);
      },
      localeMatcher: this.#localeMatcher,
      locales: this.#locales,
      types: {}
    };

    for (const res of resolvers) {
      if (typeof res.initContext === 'function')
        ctx.types[res.type] = res.initContext(this, resId, scope);
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
