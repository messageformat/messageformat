# messageformat.js loader for webpack

## Dependencies

* Requires [messageformat.js](https://github.com/messageformat/messageformat.js) 1.0.0 or higher

## Install

```
npm install messageformat-loader
```

## Usage

[Documentation: Using loaders](https://webpack.js.org/concepts/loaders/#using-loaders)

[Documentation: messageformat.js](https://messageformat.github.io/)

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

``` javascript
var messages = require('messageformat-loader?locale=en!./messages.json');
messages['ordinal-example']({ N: 1 });
// => 'The 1st message.'
```

## Options

* [`locale`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#MessageFormat) The [CLDR language code](http://www.unicode.org/cldr/charts/29/supplemental/language_territory_information.html) to pass to [messageformat.js](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html). Defaults to `en`.
* [`disablePluralKeyChecks`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#disablePluralKeyChecks) By default, messageformat.js throws an error when a statement uses a non-numerical key that will never be matched as a pluralization category for the current locale. Use this argument to disable the validation and allow unused plural keys. Defaults to `false`.
* [`intlSupport`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#setIntlSupport) Enable or disable support for the default formatters, which require the Intl object. Defaults to `false`.
* [`biDiSupport`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#setBiDiSupport) Enable or disable the addition of Unicode control characters to all input to preserve the integrity of the output when mixing LTR and RTL text. Defaults to `false`.
* [`formatters`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#addFormatters) Add custom formatter functions to this MessageFormat instance.
* [`strictNumberSign`](https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#setStrictNumberSign) Follow the stricter ICU MessageFormat spec and throw a runtime error if # is used with non-numeric input. Defaults to `false`.


## License

MIT
