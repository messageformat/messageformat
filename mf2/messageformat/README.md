# MessageFormat 2 for JavaScript

This library provides an implementation of the [ECMA-402 Intl.MessageFormat proposal],
which is built on top of the [Unicode MessageFormat 2.0 specification] (MF2),
developed by the [MessageFormat Working Group].

The API provided by this library is current as of the [LDML 46.1] (December 2024)
version of the MF2 specification.

[ecma-402 intl.messageformat proposal]: https://github.com/dminor/proposal-intl-messageformat/
[unicode messageformat 2.0 specification]: https://unicode.org/reports/tr35/tr35-messageFormat.html
[messageformat working group]: https://github.com/unicode-org/message-format-wg
[LDML 46.1]: https://www.unicode.org/reports/tr35/tr35-74/tr35-messageFormat.html

```sh
npm install --save-exact messageformat@next
```

```js
import { MessageFormat } from 'messageformat';

const msg = 'Today is {$today :datetime dateStyle=medium}';
const mf = new MessageFormat('en', msg);

mf.format({ today: new Date('2022-02-02') });
// 'Today is Feb 2, 2022'
```

The library also provides a number of other tools and utilities for MF2, such as:

- MF2 data model conversion tools

  ```js
  import { parseMessage, stringifyMessage } from 'messageformat';
  ```

- MF2 data model validation and transformation tools

  ```js
  import { validate, visit } from 'messageformat';
  ```

- Concreate Syntax Tree (CST) tools for MF2
  ```js
  import { parseCST, messageFromCST, stringifyCST } from 'messageformat';
  ```

In addition to supporting MF2 syntax,
compilers and formatting function runtimes are also provided for
ICU MessageFormat and Fluent messages:

- [@messageformat/icu-messageformat-1](https://www.npmjs.com/package/@messageformat/icu-messageformat-1)
- [@messageformat/fluent](https://www.npmjs.com/package/@messageformat/fluent)

For more information on additional types and functions provided by this package,
see the [API documentation site](https://messageformat.github.io/messageformat/api/).

> [!IMPORTANT]
> The v4 release of the `messageformat` package has
> an entirely different API compared to its earlier major releases,
> which were built on top of ICU MessageFormat, aka "MF1".
> For that,
> please see [`@messageformat/core`](https://www.npmjs.com/package/@messageformat/core) instead.
