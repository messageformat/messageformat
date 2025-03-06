This library provides a formatter and other tools for [Unicode MessageFormat 2.0] (MF2),
the new standard for localization developed by the [MessageFormat Working Group].

This includes a formatter that can be used as a polyfill for
the proposed [ECMA-402 Intl.MessageFormat] formatter.

The API provided by this library is current as of the [LDML 47] (March 2025)
Final version of the MF2 specification.

[unicode messageformat 2.0]: https://unicode.org/reports/tr35/tr35-messageFormat.html
[messageformat working group]: https://github.com/unicode-org/message-format-wg
[ecma-402 intl.messageformat ]: https://github.com/tc39/proposal-intl-messageformat/
[ldml 47]: https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html

```sh
npm install --save messageformat
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
  import { parseCST, messageFromCST, stringifyCST } from 'messageformat/cst';
  ```

- Utilities for building custom function handlers for MF2

  ```js
  import {
    DraftFunctions,
    asPositiveInteger,
    asString
  } from 'messageformat/functions';
  ```

In addition to supporting MF2 syntax,
compilers and formatting function runtimes are also provided for
ICU MessageFormat and Fluent messages:

- [@messageformat/icu-messageformat-1](https://www.npmjs.com/package/@messageformat/icu-messageformat-1)
- [@messageformat/fluent](https://www.npmjs.com/package/@messageformat/fluent)

For more information on the types and functions provided by this package,
see the [documentation site](https://messageformat.github.io/).

> [!IMPORTANT]
> The v4 release of the `messageformat` package has
> an entirely different API compared to its earlier major releases,
> which were built on top of ICU MessageFormat, aka "MF1".
> For that,
> please see [`@messageformat/core`](https://www.npmjs.com/package/@messageformat/core) instead.
