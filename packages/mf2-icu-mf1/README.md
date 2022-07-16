# Compile ICU MessageFormat 1 sources into MessageFormat 2 formatters

This library provides compatibility for using ICU MessageFormat 1 sources with
the [Unicode MessageFormat 2.0] -based [ECMA-402 Intl.MessageFormat proposal].

[ecma-402 intl.messageformat proposal]: https://github.com/tc39/proposal-intl-messageformat
[unicode messageformat 2.0]: https://github.com/unicode-org/message-format-wg

## Usage

```sh
npm install @messageformat/icu-messageformat-1
```

```js
import { compileMF1Message } from '@messageformat/icu-messageformat-1';

const locale = 'en-US';
const msg = 'Today is {today, date}';

const mf = compileMF1Message(msg, locale);

mf.resolveMessage({ today: new Date('2022-02-02') }).toString();
// 'Today is Feb 2, 2022'
```

## API

```js
import {
  compileMF1Message,
  compileMF1MessageData,
  getMF1Runtime
} from '@messageformat/icu-messageformat-1';
```

For more information, see the [API documentation site](https://messageformat.github.io/messageformat/api/).
