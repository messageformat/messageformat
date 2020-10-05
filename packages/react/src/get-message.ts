import {
  MessageContext,
  MessageObject,
  MessageValue
} from './message-context.js';

function getIn(messages: MessageValue | MessageObject, path: string[]) {
  if (messages) {
    for (let i = 0; i < path.length; ++i) {
      if (typeof messages !== 'object') return undefined;
      messages = messages[path[i]];
      if (messages === undefined) return undefined;
    }
  }
  return messages;
}

export function getPath(id?: string | string[], pathSep?: string | null) {
  if (!id) return [];
  if (Array.isArray(id)) return id;
  return pathSep ? id.split(pathSep) : [id];
}

/**
 * Given a `MessageContext` instance, fetches an entry from the messages object of the current or given locale.
 * The returned value will be `undefined` if not found, or otherwise exactly as set in the `MessageProvider` props.
 *
 * @public
 * @param context - The `MessageContext` instance
 * @param id - The key or key path of the message or message object.
 *   If empty or `[]`, matches the root of the messages object
 * @param locale - If set, overrides the current locale precedence as set by parent MessageProviders.
 */
export function getMessage(
  { locales, messages, onError, pathSep }: MessageContext,
  id?: string | string[],
  locale?: string | string[]
) {
  if (locale != null) locales = Array.isArray(locale) ? locale : [locale];
  const path = getPath(id, pathSep);
  for (let i = 0; i < locales.length; ++i) {
    const lc = locales[i];
    const msg = getIn(messages[lc], path);
    if (msg !== undefined) return msg;
  }
  return onError ? onError(path, 'ENOMSG') : undefined;
}

/**
 * @param id - Message identifier; extends the path set by `rootId`
 * @param params - Parameters for a function message
 */
export interface MessageGetterOptions {
  baseParams?: any;
  locale?: string | string[];
}

/**
 * Given a `MessageContext` instance, returns a message getter function, which may have a preset root id path, locale, and/or base parameters for message functions.
 *
 * The returned function takes two parameters `(msgId, msgParams)`, which will extend any values set by the hook's arguments.
 *
 * @public
 * @param context - The `MessageContext` instance
 * @param rootId - The key or key path of the message or message object.
 *   If empty or `[]`, matches the root of the messages object
 * @param options - If `baseParams` is set, message function parameters will be assumed to always be an object, with these values initially set.
 *   `locale` overrides the current locale precedence as set by parent MessageProviders.
 */
export function getMessageGetter(
  context: MessageContext,
  rootId?: string | string[],
  { baseParams, locale }: MessageGetterOptions = {}
) {
  const { pathSep } = context;
  const pathPrefix = getPath(rootId, pathSep);
  return function message(id?: string | string[], params?: any) {
    const path = pathPrefix.concat(getPath(id, pathSep));
    const msg = getMessage(context, path, locale);
    if (typeof msg !== 'function') return msg;
    const msgParams = baseParams
      ? Object.assign({}, baseParams, params)
      : params;
    return msg(msgParams);
  };
}
