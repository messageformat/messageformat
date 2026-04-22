/**
 * An efficient React front-end for message formatting
 *
 * @packageDocumentation
 * @remarks
 * Designed in particular for use with {@link https://messageformat.github.io | messageformat}, but will work with any messages.
 * Provides the best possible API for a front-end developer, without making the back end any more difficult than it needs to be either.
 * Should add at most about 1kB to your compiled & minified bundle size.
 *
 * @example
 * ```js
 * import {
 *   MessageContext,
 *   MessageProvider,
 *   Message,
 *   getMessage,
 *   getMessageGetter,
 *   useLocales,
 *   useMessage,
 *   useMessageGetter
 * } from '@messageformat/react'
 * ```
 */
export { getMessage, getMessageGetter } from './get-message.js';
export { Message, MessageProps } from './message.js';
export {
  MessageContext,
  MessageObject,
  MessageValue
} from './message-context.js';
export { MessageError } from './message-error.js';
export { MessageProvider, MessageProviderProps } from './message-provider.js';
export { useLocales } from './use-locales.js';
export { useMessage } from './use-message.js';
export { useMessageGetter } from './use-message-getter.js';
