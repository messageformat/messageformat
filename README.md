# ICU MessageFormat loader for webpack


## Installation

```
npm install messageformat messageformat-loader
```


## Usage

For a working demo of the loader, run `npm install` in the `example/` directory, and then open `example/dist/index.html` in a browser.

### webpack.config.js

```js
{
  test: /\bmessages\.json$/,
  loader: require.resolve('messageformat-loader'),
  options: {
    biDiSupport: false,
    disablePluralKeyChecks: false,
    formatters: null,
    intlSupport: false,
    locale: ['en'],
    strictNumberSign: false
  }
}
```

The default option values are shown, and are not required. [See below](#options) for more information on them. As Webpack v1 does not support loader options, you should instead pass the options as query parameters in that environment; `locale` will accept a comma-delimited set of values.

### messages.json

```json
{
  "simple-example": "A simple message.",
  "var-example": "Message with {X}.",
  "plural-example": "You have {N, plural, =0{no messages} one{1 message} other{# messages}}.",
  "select-example": "{GENDER, select, male{He has} female{She has} other{They have}} sent you a message.",
  "ordinal-example": "The {N, selectordinal, one{1st} two{2nd} few{3rd} other{#th}} message."
}
```

### example.js

ES6, with configuration:
```js
import messages from './messages.json'
messages['ordinal-example']({ N: 1 })
// => 'The 1st message.'
```

ES5, without configuration:
```js
var messages = require('messageformat-loader?locale=en!./messages.json');
messages['ordinal-example']({ N: 1 });
// => 'The 1st message.'
```


## Options

* [`locale`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#MessageFormat) The [CLDR language code](http://www.unicode.org/cldr/charts/29/supplemental/language_territory_information.html) or codes to pass to [messageformat.js](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html). If using multiple locales at the same time, exact matches to a locale code in the data structure keys will select that locale within it (as in [`example/src/messages.json`](example/src/messages.json)). Defaults to `en`.
* [`disablePluralKeyChecks`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#disablePluralKeyChecks) By default, messageformat.js throws an error when a statement uses a non-numerical key that will never be matched as a pluralization category for the current locale. Use this argument to disable the validation and allow unused plural keys. Defaults to `false`.
* [`intlSupport`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#setIntlSupport) Enable or disable support for the default formatters, which require the Intl object. Defaults to `false`.
* [`biDiSupport`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#setBiDiSupport) Enable or disable the addition of Unicode control characters to all input to preserve the integrity of the output when mixing LTR and RTL text. Defaults to `false`.
* [`formatters`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#addFormatters) Add custom formatter functions to this MessageFormat instance.
* [`strictNumberSign`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#setStrictNumberSign) Follow the stricter ICU MessageFormat spec and throw a runtime error if # is used with non-numeric input. Defaults to `false`.


## Links

- [messageformat](https://messageformat.github.io/)
- Loaders:
  - [Webpack v1](https://webpack.github.io/docs/using-loaders.html)
  - [Webpack v2/3](https://webpack.js.org/concepts/loaders/)


## License

MIT
