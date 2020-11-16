---
title: Usage
nav_order: 3
has_children: true
---

# Using messageformat
{: .no_toc }

## Build Tools

Fundamentally, `@messageformat/core` is a compiler that turns ICU MessageFormat input into JavaScript.
While it's certainly possible to use it directly in your client code, it's really intended for use as a part of your build, unlike other such libraries.
The main benefits of this are:

1. Being able to keep the message sources in a human-friendly file format.
2. Not needing the compiler at all in your client code, saving both bundle size and execution time.
3. Ensuring that syntax errors are caught during the build, rather than at runtime.
4. Not needing to call `new Function` during runtime.

To help achieve this, we provide a [Webpack loader], a [Rollup plugin], and a [command-line tool].
You may of course also use the [JS API](./api/core.md) of the core package directly.

[webpack loader]: https://www.npmjs.com/package/@messageformat/loader
[rollup plugin]: https://www.npmjs.com/package/rollup-plugin-messageformat
[command-line tool]: https://www.npmjs.com/package/@messageformat/cli

## Runtime Tools

With the build tools your messages are made available in your runtime environment as a JavaScript function, which might be enough in some cases.
Often, though, you'll want additional tooling to actually use the messages.

For React, [`@messageformat/react`](./api/react.md) provides an efficient front-end for message handling and formatting, mostly based around custom hooks.
For vanilla JS and otherwise, [`@messageformat/runtime/messages`](./api/runtime.messages.md) provides a generic storage and accessor class.

## Conversion Tools

In addition to working with MessageFormat directly, [gettext-to-messageformat](https://www.npmjs.com/package/gettext-to-messageformat) and its accompanying [messageformat-po-loader](https://www.npmjs.com/package/messageformat-po-loader) allow you to work with .po and .mo files, by first converting the gettext sources to ICU MessageFormat.

In a similar vein, [@messageformat/convert](https://www.npmjs.com/package/messageformat-convert) is a configurable tool for converting other message forms to ICU MessageFormat.
It's used internally by [@messageformat/loader](https://www.npmjs.com/package/@messageformat/loader) and [rollup-plugin-messageformat](https://www.npmjs.com/package/rollup-plugin-messageformat), and with its default settings will convert input matching the Rails i18n spec.

## Examples

Using either the Webpack or Rollup tooling, the following usage patterns become possible:

```yaml
# messages.yaml
time: '{0} took {1} ms to complete.'
ordinal: 'The {pos, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} message.'
```

```js
// plain.js
import messages from './messages.yaml';
messages.time(['Sweeping', 42]); // 'Sweeping took 42 ms to complete.'
messages.ordinal({ pos: 1 }); // 'The 1st message.'
```

```js
// runtime-messages.js
import Messages from '@messageformat/runtime/messages';
import msgData from './messages.yaml';
const messages = new Messages(msgData, 'en');

messages.hasMessage('time'); // true
messages.get('ordinal', { pos: 3 }); // 'The 3rd message.'
```

```js
// react.js
import React from 'react';
import { MessageProvider, useMessage } from '@messageformat/react';
import messages from './messages.yaml';

const Example = () => useMessage('time', ['The task', 1300]])
// The task took 1300 ms to complete.

export const Wrapper = () => (
  <MessageProvider messages={messages}>
    <Example />
  </MessageProvider>
);
```
