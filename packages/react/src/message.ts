import { useContext } from 'react';
import { getMessage, getPath } from './get-message';
import { MessageContext } from './message-context';

/** @public */
export interface MessageProps {
  /**
   * If a function, will be called with the found message.
   * In this case, `params` will be ignored and `id` is optional.
   * If some other type of non-empty renderable node, it will be used as a fallback value if the message is not found.
   */
  children?: unknown;

  /** The key or key path of the message. */
  id?: string | string[];

  /** If set, overrides the `locale` of the nearest MessageProvider. */
  locale?: string | string[];

  /**
   * Parameters to pass to function messages as their first and only argument.
   * `params` will override `msgParams`, to allow for data keys such as `key` and `locale`.
   */
  params?: unknown;

  /**
   * Parameters to pass to function messages as their first and only argument.
   * Overriden by `params`, to allow for data keys such as `key` and `locale`.
   */
  [msgParamKey: string]: unknown;
}

// Just using { foo, ...bar } adds a polyfill with a boilerplate copyright
// statement that would add 50% to the minified size of the whole library.
function rest(props: { [key: string]: unknown }, exclude: string[]) {
  const t: typeof props = {};
  for (const k of Object.keys(props)) if (!exclude.includes(k)) t[k] = props[k];
  return t;
}

/**
 * `<Message id [locale] [params] [...msgParams]>`
 *
 * The value of a message.
 * May also be used with a render prop: `<Message id={id}>{msg => {...}}</Message>`.
 *
 * @public
 *
 * @example
 * ```js
 * import React from 'react'
 * import { Message, MessageProvider } from '@messageformat/react'
 *
 * const messages = { example: { key: ({ thing }) => `Your ${thing} here` } }
 *
 * const Example = () => (
 *   <span>
 *     <Message id="example.key" thing="message" />
 *   </span>
 * ) // 'Your message here'
 *
 * export const App = () => (
 *   <MessageProvider messages={messages}>
 *     <Example />
 *   </MessageProvider>
 * )
 * ```
 */
export function Message(props: MessageProps) {
  const { children, id, locale, params } = props;
  const msgParams = rest(props, ['children', 'id', 'locale', 'params']);
  let context = useContext(MessageContext);
  let fallback = false;
  if (children && typeof children !== 'function')
    context = Object.assign({}, context, { onError: () => (fallback = true) });
  const msg = getMessage(context, id, locale);
  if (fallback) return children;
  if (typeof children === 'function') return children(msg);
  switch (typeof msg) {
    case 'function':
      return msg(Object.assign(msgParams, params));
    case 'boolean':
      return String(msg);
    case 'object':
      if (msg && !Array.isArray(msg))
        return context.onError ? context.onError(getPath(id), 'EBADMSG') : null;
  }
  return msg || null;
}
