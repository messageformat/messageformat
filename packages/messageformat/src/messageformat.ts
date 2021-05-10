import {
  isMessage,
  Message,
  MessageGroup,
  Resource,
  Runtime,
  Scope
} from './data-model';
import { createContext } from './format-context';
import { FormattedPart, formatToParts, formatToString } from './format-message';
import { runtime as defaultRuntime } from './runtime/default';

function getEntry(res: Resource, path: string[]) {
  let msg: MessageGroup | Message = res;
  for (const part of path) {
    if (!msg || 'value' in msg) return undefined;
    msg = msg.entries[part];
  }
  return msg;
}

export type Formatter<T = string> = (
  msgPath: string | string[],
  msgScope?: Partial<Scope<T>> | undefined
) => string;

export type FormatterToParts<T = string> = (
  msgPath: string | string[],
  msgScope?: Partial<Scope<T>> | undefined
) => FormattedPart<T>[];

/**
 * Create a new message formatter.
 *
 * If `runtime` is unset, a default minimal set is used, consisting of `plural`
 * for selection and `datetime` & `number` formatters based on the `Intl`
 * equivalents.
 */
export class MessageFormat<R = string> {
  locales: string[];
  resources: Resource[];
  runtime: Runtime<R>;

  constructor(
    locales: string | string[],
    runtime?: Runtime<R> | null,
    ...resources: Resource[]
  ) {
    this.locales = Array.isArray(locales) ? locales : [locales];
    this.resources = resources;
    this.runtime = runtime || ((defaultRuntime as unknown) as Runtime<R>);
  }

  addResources(...resources: Resource[]) {
    this.resources.splice(0, 0, ...resources);
  }

  createFormatter<S = string>(
    basePath: string | string[],
    baseScope?: Scope<S>
  ): Formatter<S>;
  createFormatter<S = string>(
    resId: string,
    basePath: string | string[],
    baseScope?: Scope<S>
  ): Formatter<S>;
  createFormatter<S = string>(
    arg0: string | string[],
    arg1?: string | string[] | Scope<S>,
    arg2?: Scope<S>
  ) {
    const { resId, msgPath: basePath, scope } = this.parseArgs(
      arg0,
      arg1,
      arg2
    );
    return (msgPath: string | string[], msgScope?: Partial<Scope<S>>) =>
      this.format(
        resId,
        basePath.concat(msgPath),
        msgScope ? Object.assign({}, scope, msgScope) : scope
      );
  }

  createFormatterToParts<S = string>(
    basePath: string | string[],
    baseScope?: Scope<S>
  ): FormatterToParts<R | S>;
  createFormatterToParts<S = string>(
    resId: string,
    basePath: string | string[],
    baseScope?: Scope<S>
  ): FormatterToParts<R | S>;
  createFormatterToParts<S = string>(
    arg0: string | string[],
    arg1?: string | string[] | Scope<S>,
    arg2?: Scope<S>
  ) {
    const { resId, msgPath: basePath, scope } = this.parseArgs(
      arg0,
      arg1,
      arg2
    );
    return (msgPath: string | string[], msgScope?: Partial<Scope<S>>) =>
      this.formatToParts(
        resId,
        basePath.concat(msgPath),
        msgScope ? Object.assign({}, scope, msgScope) : scope
      );
  }

  format<S = string>(msgPath: string | string[], scope?: Scope<S>): string;
  format<S = string>(
    resId: string,
    msgPath: string | string[],
    scope?: Scope<S>
  ): string;
  format<S = string>(
    arg0: string | string[],
    arg1?: string | string[] | Scope<S>,
    arg2?: Scope<S>
  ) {
    const { resId, msgPath, scope } = this.parseArgs(arg0, arg1, arg2);
    const msg = this.getEntry(resId, msgPath);
    return isMessage(msg)
      ? formatToString(createContext<R, S>(this, resId, scope), msg)
      : '';
  }

  formatToParts<S = string>(
    msgPath: string | string[],
    scope?: Scope<S>
  ): FormattedPart<R | S>[];
  formatToParts<S = string>(
    resId: string,
    msgPath: string | string[],
    scope?: Scope<S>
  ): FormattedPart<R | S>[];
  formatToParts<S = string>(
    arg0: string | string[],
    arg1?: string | string[] | Scope<S>,
    arg2?: Scope<S>
  ) {
    const { resId, msgPath, scope } = this.parseArgs(arg0, arg1, arg2);
    const msg = this.getEntry(resId, msgPath);
    return isMessage(msg)
      ? formatToParts(createContext<R, S>(this, resId, scope), msg)
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

  private parseArgs<S = string>(
    arg0: string | string[],
    arg1?: string | string[] | Scope<S>,
    arg2?: Scope<S>
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
