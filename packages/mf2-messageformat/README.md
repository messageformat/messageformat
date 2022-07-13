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

The API provided by this Intl.MessageFormat polyfill is current as of
[2022-02-05](https://github.com/dminor/proposal-intl-messageformat/blob/9e3eb30/README.md).

## Usage

In addition to supporting MF2 syntax,
compilers and formatting function runtimes are also provided for
ICU MessageFormat and Fluent messages.

Setup is currently a little tedious,
as the packages are not yet published on npm:

```sh
git clone https://github.com/messageformat/messageformat.git
cd messageformat
npm install
npm run build
# The examples below will now run within the source repo.
```

With MessageFormat 2, formatting to a string:

```js
import { MessageFormat } from 'messageformat';

const locale = 'en-US';
const msg = '{Today is {$today :datetime dateStyle=medium}}';

const mf = new MessageFormat(msg, locale);

mf.resolveMessage({ today: new Date('2022-02-02') }).toString();
// 'Today is Feb 2, 2022'
```

With ICU MessageFormat, formatting to a string:

```js
import { compileMF1Message } from '@messageformat/compiler';

const locale = 'en-US';
const msg = 'Today is {today, date}';

const mf = compileMF1Message(msg, locale);

mf.resolveMessage({ today: new Date('2022-02-02') }).toString();
// 'Today is Feb 2, 2022'
```

With Fluent, formatting to a message:

```js
import { compileFluentResource } from '@messageformat/compiler';

const locale = 'en-US';
const src = 'msg = Today is {DATETIME($today, dateStyle: "medium")}\n';

const res = compileFluentResource(src, locale);

const msg = res.get('msg').resolveMessage({ today: new Date('2022-02-02') });
// ResolvedMessage {
//   type: 'message',
//   value: [
//     MessageLiteral { type: 'literal', value: 'Today is ' },
//     MessageDateTime {
//       type: 'datetime',
//       value: 2022-02-02T00:00:00.000Z,
//       options: { localeMatcher: 'best fit', dateStyle: 'medium' },
//       source: 'DATETIME($today)'
//     }
//   ]
// }

msg.toString();
// 'Today is Feb 2, 2022'
```
