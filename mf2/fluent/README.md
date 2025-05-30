# @messageformat/fluent

This library provides conversion and compatibility tools for using [Fluent] resources
with the [Unicode MessageFormat 2.0] -based [ECMA-402 Intl.MessageFormat proposal].

The Fluent message representation relies on [`@fluent/syntax`],
while the MessageFormat 2 representation uses [`messageformat`].

This package is distributed only as an ES module.

[fluent]: https://projectfluent.org/
[ecma-402 intl.messageformat proposal]: https://github.com/tc39/proposal-intl-messageformat
[unicode messageformat 2.0]: https://github.com/unicode-org/message-format-wg
[`@fluent/syntax`]: https://www.npmjs.com/package/@fluent/syntax
[`messageformat`]: https://www.npmjs.com/package/messageformat

## Usage

```sh
npm install @messageformat/fluent
```

```js
import { fluentToResource } from '@messageformat/fluent';

const locale = 'en-US';
const src = 'msg = Today is {DATETIME($today, dateStyle: "medium")}\n';

const resource = fluentToResource(locale, src);
const msg = resource.get('msg').get('');

msg.format({ today: new Date('2022-02-02') });
// 'Today is Feb 2, 2022'

msg.formatToParts({ today: new Date('2022-02-02') });
// [
//   { type: 'text', value: 'Today is ' },
//   {
//     type: 'datetime',
//     dir: 'ltr',
//     locale: 'en',
//     parts: [
//       { type: 'month', value: 'Feb' },
//       { type: 'literal', value: ' ' },
//       { type: 'day', value: '2' },
//       { type: 'literal', value: ', ' },
//       { type: 'year', value: '2022' }
//     ]
//   }
// ]
```

## API

```js
import {
  fluentToMessage,
  fluentToResource,
  fluentToResourceData,
  getMessageFunction,
  messageToFluent,
  resourceToFluent
} from '@messageformat/fluent';

import type {
  FluentMessageResource,
  FluentMessageResourceData
} from '@messageformat/fluent';
```

For more information, see the [documentation site](http://messageformat.github.io/).
