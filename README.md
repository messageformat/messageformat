# yaml-to-messageformat

Converts yaml input (e.g. as used by Rails i18n) into [messageformat]-compatible
JSON.

### Installation

```sh
npm install yaml-to-messageformat
```
or
```sh
yarn add yaml-to-messageformat
```

If using in an environment that does not natively support ES6 features such as
object destructuring and arrow functions, you'll want to use a transpiler for this.


### Usage

```js
const convert = require('yaml-to-messageformat')
const { locales, translations } = convert(`
en:
  format: "%{attribute} %{message}"
  errors:
    confirmation: "doesn't match %{attribute}"
    accepted: "must be accepted"
    wrong_length:
      one: "is the wrong length (should be 1 character)"
      other: "is the wrong length (should be %{count} characters)"
    equal_to: "must be equal to %{count}"
`)

const MessageFormat = require('messageformat')
const mf = new MessageFormat(locales)
const messages = mf.compile(translations)

messages.en.errors.accepted()
// 'must be accepted'

messages.en.format({
  attribute: 'Problem',
  message: messages.en.errors.confirmation({ attribute: 'your style' })
})
// 'Problem doesn\'t match your style'

messages.en.errors.wrong_length({ count: 42 })
// 'is the wrong length (should be 42 characters)'
```


### API: `convert(input, options)`

`input` should be a string; `options` is an optional set of configuration:

- `defaultLocale` (string, default `'en'`) – Sets the initial locale.

- `includeLocales` (array of strings, default `null`) – By default any key in the
  input data that matches the two-letter code of a [CLDR pluralisation language]
  switches the language used for determining the pluralisation rules. Set this to
  some limited set of languages (or even an empty array) to limit that.

- `merge` (boolean, default `false`) – Enables YAML merge keys; see the [yaml]
  documentation for details

- `verbose` (boolean, default `false`) – If set to `true`, some logging and
  warnings will be printed to the console.

For more options, take a look at the [source](./index.js).

The object returned by the function contains the following fields:

- `locales` (array of strings) – The actual locales encountered in the data

- `translations` (object) – An object containing the MessageFormat strings,
  matching the shape of the input data

[CLDR pluralisation language]: http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
[messageformat]: https://messageformat.github.io/
[yaml]: https://eemeli.org/yaml/#data-schemas
