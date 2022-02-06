# A Polyfill for Intl.MessageFormat

This library provides a runtime for the [ECMA-402 Intl.MessageFormat proposal],
which is built on top of the developing [Unicode MessageFormat 2.0 specification], "MF2".
Specifically, this is an implementation of the latter's [ez-spec draft].

[ecma-402 intl.messageformat proposal]: https://github.com/dminor/proposal-intl-messageformat/
[unicode messageformat 2.0 specification]: https://github.com/unicode-org/message-format-wg
[ez-spec draft]: https://github.com/unicode-org/message-format-wg/blob/ez-spec/spec.md

> **NOTE**: This means that the v4 release of the `messageformat` package has
> an entirely different API compared to its earlier major releases,
> which were built on top of ICU MessageFormat, aka "MF1".
> For that,
> please see [`@messageformat/core`](https://www.npmjs.com/package/@messageformat/core) instead.

The API provided by this Intl.MessageFormat polyfill is current as of
[2022-02-05](https://github.com/dminor/proposal-intl-messageformat/blob/9e3eb30/README.md).

## Usage

As the MF2 syntax is still under active development,
compilers and formatting function runtimes are provided separately
to provide compatibility with ICU MessageFormat and Fluent messages.

Setup is currently a little tedious,
as the packages are not yet published on npm:

```sh
git clone https://github.com/messageformat/messageformat.git
cd messageformat
git checkout --track origin/mf2
npm install
npm run build:mf2
# The examples below will now run within the source repo.
```

With ICU MessageFormat, formatting to a string:

```js
import { compileMF1 } from '@messageformat/compiler'
import { MessageFormat, mf1Runtime } from 'messageformat'

const locale = 'en-US'
const msg = 'Today is {today, date}'

const res = compileMF1({ msg }, { id: 'res', locale })
const mf = new MessageFormat(locale, { runtime: mf1Runtime }, res)

mf.format('msg', { today: new Date('2022-02-02') })
// 'Today is Feb 2, 2022'
```

With Fluent, formatting to a message:

```js
import { compileFluent } from '@messageformat/compiler'
import { MessageFormat, fluentRuntime } from 'messageformat'

const locale = 'en-US'
const src = 'msg = Today is {DATETIME($today, dateStyle: "medium")}\n'

const res = compileFluent(src, { id: 'res', locale })
const mf = new MessageFormat(locale, { runtime: fluentRuntime }, res)

const resMsg = mf.getMessage('msg', { today: new Date('2022-02-02') })
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

resMsg.toString()
// 'Today is Feb 2, 2022'
```


