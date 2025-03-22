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
import { mf1ToMessage } from '@messageformat/icu-messageformat-1';

const locale = 'en-US';
const msg = 'Today is {today, date}';

const mf = mf1ToMessage(msg, locale);

mf.format({ today: new Date('2022-02-02') });
// 'Today is Feb 2, 2022'
```

## API

```js
import {
  MF1Functions,
  mf1ToMessage,
  mf1ToMessageData
} from '@messageformat/icu-messageformat-1';
```

For more information, see the [documentation site](https://messageformat.github.io/).
