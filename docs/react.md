---
title: React
parent: Usage
---

# MessageFormat in React

An efficient React front-end for message formatting libraries.
Designed in particular for use with [messageformat], but will work with any messages.
Provides the best possible API for a front-end developer, without making the back end any more difficult than it needs to be either.
Should add **at most about 1kB** to your compiled & minified bundle size.

This package was previously named [react-message-context].

## Installation

```
npm install @messageformat/react
```

The library is published as an **ES module** only, which should work directly with almost all tools and environments that support modern development targeting browser environments.
For tools such as Jest that define their own import methods, you may need to add something like `transformIgnorePatterns: ['node_modules/(?!@messageformat/react)']` to your configuration.

## [API Documentation]

- [`<MessageProvider messages [locale] [onError] [pathSep]>`](http://messageformat.github.io/messageformat/api/react.messageprovider/)
- [`<Message id [locale] [props] [...msgProps]>`](http://messageformat.github.io/messageformat/api/react.message/)
- [`useLocales()`](http://messageformat.github.io/messageformat/api/react.uselocales/)
- [`useMessage(id, [params], [locale])`](http://messageformat.github.io/messageformat/api/react.usemessage/)
- [`useMessageGetter(rootId, [{ baseParams, locale }])`](http://messageformat.github.io/messageformat/api/react.usemessagegetter/)

## Usage Examples

In addition to the examples included below and in the [API documentation], see the [example] for a simple, but fully functional example of using this library along with [@messageformat/loader] to handle localized messages, with dynamic loading of non-default locales.

Within a `MessageProvider`, access to the messages is possible using either the `Message` component, or via custom hooks such as `useMessageGetter`:

```js
import React from 'react';
import {
  Message,
  MessageProvider,
  useMessageGetter
} from '@messageformat/react';

const messages = {
  message: 'Your message is important',
  answers: {
    sixByNine: ({ base }) => (6 * 9).toString(base),
    universe: 42
  }
};

function Equality() {
  const getAnswer = useMessageGetter('answers');
  const foo = getAnswer('sixByNine', { base: 13 });
  const bar = getAnswer('universe');
  return `${foo} and ${bar} are equal`;
}

export const Example = () => (
  <MessageProvider messages={messages}>
    <ul>
      <li>
        <Message id="message" />
      </li>
      <li>
        <Equality />
      </li>
    </ul>
  </MessageProvider>
);

// Will render as:
//   - Your message is important
//   - 42 and 42 are equal
```

Using MessageProviders within each other allows for multiple simultaneous locales and namespaces, with the outermost acting as a fallback for the inner one:

```jsx
import React from 'react';
import { Message, MessageProvider } from '@messageformat/react';

export const Example = () => (
  <MessageProvider locale="en" messages={{ foo: 'FOO', qux: 'QUX' }}>
    <MessageProvider locale="fi" messages={{ foo: 'FÖÖ', bar: 'BÄR' }}>
      <ul>
        <li>
          <Message id="foo" />
        </li>
        <li>
          <Message id="foo" locale="en" />
        </li>
        <li>
          <Message id="bar" />
        </li>
        <li>
          <Message id="bar" locale="en" />
        </li>
        <li>
          <Message id="qux" />
        </li>
        <li>
          <Message id="quux">xyzzy</Message>
        </li>
      </ul>
    </MessageProvider>
  </MessageProvider>
);

// Will render as:
// - FÖÖ
// - FOO
// - BÄR
// - bar  (uses fallback to key)
// - QUX  (uses fallback to "en" locale)
// - xyzzy  (uses fallback to child node)
```

[messageformat]: https://messageformat.github.io
[react-message-context]: https://www.npmjs.com/package/react-message-context
[api documentation]: http://messageformat.github.io/messageformat/api/react/
[example]: https://github.com/messageformat/messageformat/tree/master/packages/react/example
[@messageformat/loader]: https://www.npmjs.com/package/@messageformat/loader
