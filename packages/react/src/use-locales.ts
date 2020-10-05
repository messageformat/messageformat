import { useContext } from 'react';
import { MessageContext } from './message-context';

/**
 * A custom React hook providing the current locales as an array of string identifiers, with earlier entries taking precedence over latter ones.
 * Undefined locales are identified by an empty string `''`.
 *
 * @public
 *
 * @example
 * ```js
 * import React from 'react'
 * import { MessageProvider, useLocales } from '@messageformat/react'
 *
 * <MessageProvider locale="en" messages={{ foo: 'FOO' }}>
 *   {() => useLocales().join(',') // 'en'
 *   }
 *   <MessageProvider locale="fi" messages={{ foo: 'FÖÖ' }}>
 *     {() => useLocales().join(',') // 'fi,en'
 *     }
 *   </MessageProvider>
 * </MessageProvider>
 * ```
 *
 * @example
 * ```js
 * import React, { Component } from 'react'
 * import { MessageContext, MessageProvider, useLocales } from '@messageformat/react'
 *
 * // Within a class component, locales are available via the context object
 * class Foo extends Component {
 *   static contextType = MessageContext
 *   declare context: React.ContextType<typeof MessageContext> // TS
 *   render() {
 *     const { locales } = this.context
 *     return locales.join(',')
 *   }
 * }
 * ```
 */
export function useLocales() {
  const { locales } = useContext(MessageContext);
  return locales.slice();
}
