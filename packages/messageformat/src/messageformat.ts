import {
  isMessage,
  Message,
  MessageGroup,
  PatternElement,
  Resource
} from './data-model';
import { createContext } from './format-context';
import { formatToParts } from './format-message';
import { FormattedPart } from './formatted-part';
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

export type Formatter = (
  msgPath: string | string[],
  msgScope?: Partial<Scope> | undefined
) => string;

export type FormatterToParts<T = string> = (
  msgPath: string | string[],
  msgScope?: Partial<Scope> | undefined
) => FormattedPart<T>[];

/**
 * Create a new message formatter.
 *
 * If `runtime` is unset, a default minimal set is used, consisting of `plural`
 * for selection and `datetime` & `number` formatters based on the `Intl`
 * equivalents.
 */
export class MessageFormat<
  R = string,
  P extends PatternElement = PatternElement
> {
  locales: string[];
  resources: Resource<P>[];
  runtime: Runtime;

  constructor(
    locales: string | string[],
    runtime?: Runtime | null,
    ...resources: Resource<P>[]
  ) {
    this.locales = Array.isArray(locales) ? locales : [locales];
    this.resources = resources;
    this.runtime = runtime || defaultRuntime;
  }

  addResources(...resources: Resource<P>[]) {
    this.resources.splice(0, 0, ...resources);
  }

  createFormatter(basePath: string | string[], baseScope?: Scope): Formatter;
  createFormatter(
    resId: string,
    basePath: string | string[],
    baseScope?: Scope
  ): Formatter;
  createFormatter(
    arg0: string | string[],
    arg1?: string | string[] | Scope,
    arg2?: Scope
  ) {
    const { resId, msgPath: basePath, scope } = this.parseArgs(
      arg0,
      arg1,
      arg2
    );
    return (msgPath: string | string[], msgScope?: Partial<Scope>) =>
      this.format(
        resId,
        basePath.concat(msgPath),
        msgScope ? Object.assign({}, scope, msgScope) : scope
      );
  }

  createFormatterToParts<S = string>(
    basePath: string | string[],
    baseScope?: Scope
  ): FormatterToParts<R | S>;
  createFormatterToParts<S = string>(
    resId: string,
    basePath: string | string[],
    baseScope?: Scope
  ): FormatterToParts<R | S>;
  createFormatterToParts(
    arg0: string | string[],
    arg1?: string | string[] | Scope,
    arg2?: Scope
  ) {
    const { resId, msgPath: basePath, scope } = this.parseArgs(
      arg0,
      arg1,
      arg2
    );
    return (msgPath: string | string[], msgScope?: Partial<Scope>) =>
      this.formatToParts(
        resId,
        basePath.concat(msgPath),
        msgScope ? Object.assign({}, scope, msgScope) : scope
      );
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
      const ctx = createContext<R>(this, resId, scope);
      for (const fp of formatToParts(ctx, msg)) res += fp.toString();
    }
    return res;
  }

  formatToParts<S = string>(
    msgPath: string | string[],
    scope?: Scope
  ): FormattedPart<R | S>[];
  formatToParts<S = string>(
    resId: string,
    msgPath: string | string[],
    scope?: Scope
  ): FormattedPart<R | S>[];
  formatToParts(
    arg0: string | string[],
    arg1?: string | string[] | Scope,
    arg2?: Scope
  ) {
    const { resId, msgPath, scope } = this.parseArgs(arg0, arg1, arg2);
    const msg = this.getEntry(resId, msgPath);
    return isMessage(msg)
      ? formatToParts(createContext<R>(this, resId, scope), msg)
      : [];
  }

  getEntry(resId: string, path: string | string[]) {
    const p = Array.isArray(path) ? path : [path];
    for (const res of this.resources) {
      if (res.id === resId) {
        const msg = getEntry(res, p);
        if (msg !== undefined) return msg;
      }
    }
    return undefined;
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
      const r0 = this.resources[0];
      if (!r0) throw new Error('No resources available');
      const resId = r0.id;
      for (const res of this.resources)
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
