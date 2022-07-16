# Compile Fluent sources into MessageFormat 2 resources

This library provides compatibility for using [Fluent] sources with
the [Unicode MessageFormat 2.0] -based [ECMA-402 Intl.MessageFormat proposal].

[fluent]: https://projectfluent.org/
[ecma-402 intl.messageformat proposal]: https://github.com/tc39/proposal-intl-messageformat
[unicode messageformat 2.0]: https://github.com/unicode-org/message-format-wg

## Usage

```sh
npm install @messageformat/fluent
```

```js
import { compileFluentResource } from '@messageformat/fluent';

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
//       source: '$today :DATETIME'
//     }
//   ]
// }

msg.toString();
// 'Today is Feb 2, 2022'
```


## API

```js
import {
  compileFluentResource,
  compileFluentResourceData,
  getFluentRuntime
} from '@messageformat/fluent';
```

For more information, see the [API documentation site](https://messageformat.github.io/messageformat/api/).
