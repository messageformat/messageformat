# messageformat-convert

Converts hiearachical objects into [messageformat]-compatible JSON. More
specifically, it:

- Detects two-letter locale keys and parses their contents according to that
  locale's pluralisation rules
- Converts `#{var}` and `%{var}` variable replacements into their messageformat
  equivalents, while properly escaping other `{}` characters.
- Detects objects encoding pluralisation choices (using the locale-specific set
  of CLDR categories, i.e. `zero|one|two|few|many|aother`) and converts them to
  their messageformat equivalents.

With these conversions, messages stored according to the Rails i18n spec may be
used together with [messageformat].

### Installation

```sh
npm install messageformat-convert
```

If using in an environment that does not natively support ES6 features such as
object destructuring and arrow functions, you'll want to use a transpiler for this.

### Usage

```js
const convert = require('messageformat-convert');
const { locales, translations } = convert({
  en: {
    format: '%{attribute} %{message}',
    errors: {
      confirmation: "doesn't match %{attribute}",
      accepted: 'must be accepted',
      wrong_length: {
        one: 'is the wrong length (should be 1 character)',
        other: 'is the wrong length (should be %{count} characters)'
      },
      equal_to: 'must be equal to %{count}'
    }
  }
});

const MessageFormat = require('messageformat');
const mf = new MessageFormat(locales);
const messages = mf.compile(translations);

messages.en.errors.accepted();
// 'must be accepted'

messages.en.format({
  attribute: 'Problem',
  message: messages.en.errors.confirmation({ attribute: 'your style' })
});
// 'Problem doesn\'t match your style'

messages.en.errors.wrong_length({ count: 42 });
// 'is the wrong length (should be 42 characters)'
```

### API: `convert(data, options)`

`data` should be a hierarchical object of strings; `options` is an optional set
of configuration:

- `defaultLocale` (string, default `'en'`) – Sets the initial locale.

- `includeLocales` (array of strings, default `null`) – By default any key in the
  input data that matches the two-letter code of a [CLDR pluralisation language]
  switches the language used for determining the pluralisation rules. Set this to
  some limited set of languages (or even an empty array) to limit that.

- `verbose` (boolean, default `false`) – If set to `true`, some logging and
  warnings will be printed to the console.

For more options, take a look at the [source](./index.js).

The object returned by the function contains the following fields:

- `locales` (array of strings) – The actual locales encountered in the data

- `translations` (object) – An object containing the MessageFormat strings,
  matching the shape of the input data

[cldr pluralisation language]: http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
[messageformat]: https://messageformat.github.io/

---

[Messageformat](https://messageformat.github.io/) is an OpenJS Foundation project, and we follow its [Code of Conduct](https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md).

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
