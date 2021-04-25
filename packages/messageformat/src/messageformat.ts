import {
  isMessage,
  Message,
  MessageGroup,
  Resource,
  Runtime,
  Scope
} from './data-model';
import { createContext } from './format-context';
import { formatToParts, formatToString } from './format-message';
import { runtime as defaultRuntime } from './runtime/default';

function getEntry(res: Resource, path: string[]) {
  let msg: MessageGroup | Message = res;
  for (const part of path) {
    if (!msg || 'value' in msg) return undefined;
    msg = msg.entries[part];
  }
  return msg;
}

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
    resId: string,
    basePath: string[] = [],
    baseScope: Scope<S> = {}
  ) {
    return (msgPath: string | string[], msgScope?: Partial<Scope<S>>) =>
      this.format(
        resId,
        basePath.concat(msgPath),
        msgScope ? Object.assign({}, baseScope, msgScope) : baseScope
      );
  }

  createFormatterToParts<S = string>(
    resId: string,
    basePath: string[] = [],
    baseScope: Scope<S> = {}
  ) {
    return (msgPath: string | string[], msgScope?: Partial<Scope<S>>) =>
      this.formatToParts(
        resId,
        basePath.concat(msgPath),
        msgScope ? Object.assign({}, baseScope, msgScope) : baseScope
      );
  }

  format<S = string>(resId: string, msgPath: string[], scope: Scope<S> = {}) {
    const msg = this.getEntry(resId, msgPath);
    return isMessage(msg)
      ? formatToString(createContext<R, S>(this, resId, scope), msg)
      : '';
  }

  formatToParts<S = string>(
    resId: string,
    msgPath: string[],
    scope: Scope<S> = {}
  ) {
    const msg = this.getEntry(resId, msgPath);
    return isMessage(msg)
      ? formatToParts(createContext<R, S>(this, resId, scope), msg)
      : [];
  }

  getEntry(resId: string, path: string[]) {
    for (const res of this.resources) {
      if (res.id === resId) {
        const msg = getEntry(res, path);
        if (msg !== undefined) return msg;
      }
    }
    return undefined;
  }
}
