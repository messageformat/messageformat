// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - https://github.com/microsoft/rushstack/issues/1050
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Context, createContext } from 'react';
import { ErrorCode } from './message-error';

/** @internal */
export type MessageValue =
  | string
  | number
  | boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((props: any) => unknown);

/** @internal */
export interface MessageObject {
  [key: string]: MessageValue | MessageObject;
}

/** @public */
export interface MessageContext {
  locales: string[];
  merge: (target: MessageObject, ...sources: MessageObject[]) => MessageObject;
  messages: MessageObject;

  /** Always defined in MessageProvider children */
  onError?: (path: string[], code: ErrorCode) => unknown;
  pathSep: string | null;
}

export const defaultValue: MessageContext = {
  locales: [],
  merge: Object.assign,
  messages: {},
  pathSep: '.'
};

/**
 * The context object used internally by the library.
 * Probably only useful with `Class.contextType` or for building custom hooks.
 *
 * @public
 *
 * @example
 * ```js
 * import React, { Component } from 'react'
 * import {
 *   getMessage,
 *   getMessageGetter,
 *   MessageContext,
 *   MessageProvider
 * } from '@messageformat/react'
 *
 * const messages = {
 *   example: { key: 'Your message here' },
 *   other: { key: 'Another message' }
 * }
 *
 * class Example extends Component {
 *   render() {
 *     const message = getMessage(this.context, 'example.key')
 *     const otherMsg = getMessageGetter(this.context, 'other')
 *     return (
 *       <span>
 *         {message} | {otherMsg('key')}
 *       </span>
 *     ) // 'Your message here | Another message'
 *   }
 * }
 * Example.contextType = MessageContext
 *
 * export const App = () => (
 *   <MessageProvider messages={messages}>
 *     <Example />
 *   </MessageProvider>
 * )
 * ```
 */
export const MessageContext = createContext(defaultValue);
