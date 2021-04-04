import { createElement, useContext, useMemo } from 'react';
import { MessageContext, MessageObject, defaultValue } from './message-context';
import { MessageError, ErrorCode, errorMessages } from './message-error';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - https://github.com/microsoft/rushstack/issues/1050
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionComponentElement, ProviderProps } from 'react';

/** @public */
export interface MessageProviderProps {
  children: any;

  /**
   * A hierarchical object containing the messages as boolean, number, string or function values.
   */
  messages: MessageObject;
  context?: MessageContext;

  /** @deprecated Use onError instead */
  debug?: 'error' | 'warn' | ((msg: string) => any);

  /**
   * A key for the locale of the given messages.
   * If uset, will inherit the locale from the parent context, or ultimately use en empty string.
   */
  locale?: string;

  /**
   * By default, top-level namespaces defined in a child `MessageProvider` overwrite those defined in a parent.
   * Set this to {@link https://lodash.com/docs/#merge | _.merge} or some other function with the same arguments as
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign | Object.assign} to allow for deep merges.
   */
  merge?: MessageContext['merge'];

  /**
   * What to do on errors; most often called if a message is not found.
   *
   * - `"silent"`: Ignore the error; use the message's id as the replacement message.
   *
   * - `"error"`: Throw the error.
   *
   * - `"warn"` (default): Print a warning in the console and use the message's id as the replacement message.
   *
   * - `(error) => any`: A custom function that is called with an `Error` object with `code: string` and `path: string[]` fields set.
   *   The return falue is used as the replacement message.
   */
  onError?: 'error' | 'silent' | 'warn' | ((error: MessageError) => any);

  /**
   * By default, `.` in a `<Message id>` splits the path into parts, such that e.g. `'a.b'` is equivalent to `['a', 'b']`.
   * Use this option to customize or disable this behaviour (by setting it to `null`).
   */
  pathSep?: string;
}

function getOnError(
  parent: MessageContext,
  pathSep: string | null,
  onError: MessageProviderProps['onError'],
  debug: MessageProviderProps['debug']
) {
  const asId = (path: string[]) => path.join(pathSep || ',');
  function msgError(path: string[], code: ErrorCode) {
    throw new MessageError(path, code, asId);
  }
  function msgWarning(path: string[], code: ErrorCode) {
    console.warn(errorMessages[code], path);
    return asId(path);
  }

  if (onError === undefined) {
    // debug is deprecated, will be removed later
    if (typeof debug === 'function')
      return (path: string[], code: ErrorCode) =>
        debug(`${errorMessages[code]}: ${asId(path)}`);
    onError = debug;
  }

  switch (onError) {
    case 'silent':
      return asId;
    case 'error':
      return msgError;
    case 'warn':
      return msgWarning;
    default:
      if (typeof onError === 'function') {
        const _onError = onError;
        return (path: string[], code: ErrorCode) =>
          _onError(new MessageError(path, code, asId));
      }
      return parent.onError || msgWarning;
  }
}

function getLocales({ locales }: MessageContext, locale: string) {
  const fallback = locales.filter(fb => fb !== locale);
  return [locale].concat(fallback);
}

function getMessages(
  { merge, messages }: MessageContext,
  locale: string,
  lcMessages: MessageObject
) {
  const res = Object.assign({}, messages);
  const prev = res[locale];
  res[locale] =
    prev && typeof prev === 'object' ? merge({}, prev, lcMessages) : lcMessages;
  return res;
}

function getPathSep(context: MessageContext, pathSep?: string | null) {
  return pathSep === null || typeof pathSep === 'string'
    ? pathSep
    : context.pathSep;
}

/**
 * `<MessageProvider messages [locale] [merge] [onError] [pathSep]>`
 *
 * Makes the messages available for its descendants via a React Context.
 * To support multiple locales and/or namespaces, MessageProviders may be used within each other, merging each provider's messages with those of its parents.
 * The locale preference order is also set similarly, from nearest to furthest.
 *
 * @public
 *
 * @example
 * ```js
 * import React from 'react'
 * import { Message, MessageProvider } from '@messageformat/react'
 *
 * const messages = { example: { key: 'Your message here' } }
 * const extended = { other: { key: 'Another message' } }
 *
 * const Example = () => (
 *   <span>
 *     <Message id={['example', 'key']} />
 *     {' | '}
 *     <Message id="other/key" />
 *   </span>
 * ) // 'Your message here | Another message'
 *
 * export const App = () => (
 *   <MessageProvider messages={messages} pathSep="/">
 *     <MessageProvider messages={extended}>
 *       <Example />
 *     </MessageProvider>
 *   </MessageProvider>
 * )
 * ```
 */
export function MessageProvider(props: MessageProviderProps) {
  const {
    children,
    context: propContext,
    debug,
    locale = '',
    merge,
    messages,
    onError,
    pathSep
  } = props;
  let parent = useContext(MessageContext);
  if (propContext) parent = propContext;
  else if (propContext === null) parent = defaultValue;
  const value = useMemo(() => {
    const ps = getPathSep(parent, pathSep);
    return {
      locales: getLocales(parent, locale),
      merge: merge || parent.merge,
      messages: getMessages(parent, locale, messages),
      onError: getOnError(parent, ps, onError, debug),
      pathSep: ps
    };
  }, [parent, locale, merge, messages, pathSep]);
  return createElement(MessageContext.Provider, { value }, children);
}
