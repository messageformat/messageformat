# ICU MessageFormat loader for Webpack

Loader that parses input JSON & YAML objects of strings as objects of JavaScript message functions with a matching structure, using [`messageformat`](https://messageformat.github.io/messageformat/).

## Installation

```
npm install messageformat messageformat-loader
```

## Usage

For a working demo of the loader, run `npm install` in the `example/` directory, and then open `example/dist/index.html` in a browser.

### webpack.config.js

```js
{
  test: /\bmessages\.(json|ya?ml)$/,
  type: 'javascript/auto', // required by Webpack 4
  loader: require.resolve('messageformat-loader'),
  options: {
    biDiSupport: false,
    convert: false,
    customFormatters: null,
    locale: ['en'],
    strictNumberSign: false
  }
}
```

If you’re using Webpack 4, you must include `type: 'javascript/auto'` in the loader configuration to [properly parse JSON files](https://webpack.js.org/configuration/module/#rule-type).

Uses [`yaml`](https://eemeli.org/yaml/) to parse input, which allows for full JSON & YAML support. As a side effect, also supports `#comments` in JSON files.

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
import messages from './messages.json';
messages['ordinal-example']({ N: 1 });
// => 'The 1st message.'
```

ES5, without configuration:

```js
var messages = require('messageformat-loader?locale=en!./messages.json');
messages['ordinal-example']({ N: 1 });
// => 'The 1st message.'
```

## Options

- [`locale`] The [CLDR language code] or codes to pass to [`messageformat`]. If using multiple locales at the same time, exact matches to a locale code in the data structure keys will select that locale within it (as in [`example/src/messages.json`](example/src/messages.json)). Defaults to `en`.
- [`convert`] Use `messageformat-convert` to convert non-MessageFormat syntax and plural objects into MessageFormat. Use an object value to configure. Defaults to `false`.
- `biDiSupport` Enable or disable the addition of Unicode control characters to all input to preserve the integrity of the output when mixing LTR and RTL text. Defaults to `false`.
- `customFormatters` Add custom formatter functions to this MessageFormat instance.
- `strictNumberSign` Follow the stricter ICU MessageFormat spec and throw a runtime error if # is used with non-numeric input. Defaults to `false`.

[`locale`]: https://messageformat.github.io/messageformat.js/doc/MessageFormat.html#MessageFormat
[cldr language code]: http://www.unicode.org/cldr/charts/29/supplemental/language_territory_information.html
[`messageformat`]: https://messageformat.github.io/messageformat.js/doc/MessageFormat.html
[`convert`]: https://github.com/messageformat/messageformat/tree/master/packages/convert

## Links

- [messageformat](https://messageformat.github.io/)
- Loaders:
  - [Webpack v1](https://webpack.github.io/docs/using-loaders.html)
  - [Webpack v2+](https://webpack.js.org/concepts/loaders/)

## License

MIT
