# A Polyfill for Intl.MessageFormat

This library provides a runtime for the [ECMA-402 Intl.MessageFormat proposal],
which is built on top of the developing [Unicode MessageFormat 2.0 specification], "MF2".

[ecma-402 intl.messageformat proposal]: https://github.com/dminor/proposal-intl-messageformat/
[unicode messageformat 2.0 specification]: https://github.com/unicode-org/message-format-wg

> **NOTE**: This means that the v4 release of the `messageformat` package has
> an entirely different API compared to its earlier major releases,
> which were built on top of ICU MessageFormat, aka "MF1".
> For that,
> please see [`@messageformat/core`](https://www.npmjs.com/package/@messageformat/core) instead.

## Usage

```sh
npm install --save-exact messageformat@next
```

```js
import { MessageFormat } from 'messageformat';
Intl.MessageFormat = MessageFormat;
```

In addition to supporting MF2 syntax,
compilers and formatting function runtimes are also provided for
ICU MessageFormat and Fluent messages:

- [@messageformat/icu-messageformat-1](https://www.npmjs.com/package/@messageformat/icu-messageformat-1)
- [@messageformat/fluent](https://www.npmjs.com/package/@messageformat/fluent)

## API

The API provided by this Intl.MessageFormat polyfill is current as of
[2022-07-13](https://github.com/tc39/proposal-intl-messageformat/blob/72eefa5/README.md).
The static `MessageFormat.parseResource()` method is not yet provided,
as the message resource syntax is still under development.

```js
const locale = 'en-US';
const msg = '{Today is {$today :datetime dateStyle=medium}}';

const mf = new Intl.MessageFormat(msg, locale);

mf.format({ today: new Date('2022-02-02') });
// 'Today is Feb 2, 2022'
```

For more information on additional types and functions provided by this package,
see the [API documentation site](https://messageformat.github.io/messageformat/api/).
