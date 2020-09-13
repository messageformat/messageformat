import { useContext } from 'react';
import { getMessage } from './get-message';
import { MessageContext } from './message-context';

/**
 * A custom React hook providing an entry from the messages object of the current or given locale.
 * The returned value will be `undefined` if not found.
 *
 * If the identified message value is a function, the returned value will be the result of calling it with a single argument `params`, or `{}` if empty.
 * Otherwise the value set in the `MessageProvider` props will be returned directly.
 *
 * @public
 * @param id - The key or key path of the message or message object.
 *   If empty or `[]`, matches the root of the messages object
 * @param params - Argument to use if the identified message is a function
 * @param locale - If set, overrides the current locale precedence as set by parent MessageProviders.
 *
 * @example
 * ```js
 * import React from 'react'
 * import { MessageProvider, useLocales, useMessage } from '@messageformat/react'
 *
 * const en = { example: { key: 'Your message here' } }
 * const fi = { example: { key: 'Lisää viestisi tähän' } }
 *
 * // Intl.ListFormat may require a polyfill, such as intl-list-format
 * function Example() {
 *   const locales = useLocales() // ['fi', 'en']
 *   const lfOpt = { style: 'long', type: 'conjunction' }
 *   const lf = new Intl.ListFormat(locales, lfOpt)
 *   const lcMsg = lf.format(locales.map(lc => JSON.stringify(lc))) // '"fi" ja "en"'
 *   const keyMsg = useMessage('example.key') // 'Lisää viestisi tähän'
 *   return (
 *     <article>
 *       <h1>{lcMsg}</h1>
 *       <p>{keyMsg}</p>
 *     </article>
 *   )
 * }
 *
 * export const App = () => (
 *   <MessageProvider locale="en" messages={en}>
 *     <MessageProvider locale="fi" messages={fi}>
 *       <Example />
 *     </MessageProvider>
 *   </MessageProvider>
 * )
 * ```
 */
export function useMessage(
  id: string | string[],
  params?: any,
  locale?: string | string[]
) {
  const context = useContext(MessageContext);
  const msg = getMessage(context, id, locale);
  return typeof msg === 'function' ? msg(params == null ? {} : params) : msg;
}
