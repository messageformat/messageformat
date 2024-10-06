import { useContext } from 'react';
import { MessageGetterOptions, getMessageGetter } from './get-message';
import { MessageContext } from './message-context';

/**
 * A custom [React hook] providing a message getter function, which may have a preset root id path, locale, and/or base parameters for message functions.
 *
 * The returned function takes two parameters `(msgId, msgParams)`, which will extend any values set by the hook's arguments.
 *
 * @public
 * @param rootId - The key or key path of the message or message object.
 *   If empty or `[]`, matches the root of the messages object
 * @param options - If `baseParams` is set, message function parameters will be assumed to always be an object, with these values initially set.
 *   `locale` overrides the current locale precedence as set by parent MessageProviders.
 *
 * @example
 * ```js
 * import React from 'react'
 * import { MessageProvider, useMessageGetter } from '@messageformat/react'
 *
 * const messages = {
 *   example: {
 *     funMsg: ({ thing }) => `Your ${thing} here`,
 *     thing: 'message'
 *   }
 * }
 *
 * function Example() {
 *   const getMsg = useMessageGetter('example')
 *   const thing = getMsg('thing') // 'message'
 *   return getMsg('funMsg', { thing }) // 'Your message here'
 * }
 *
 * export const App = () => (
 *   <MessageProvider messages={messages}>
 *     <Example />
 *   </MessageProvider>
 * )
 * ```
 */
export function useMessageGetter(
  rootId: string | string[],
  opt?: MessageGetterOptions
) {
  const context = useContext(MessageContext);
  return getMessageGetter(context, rootId, opt);
}
