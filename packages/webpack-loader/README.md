# ICU MessageFormat loader for Webpack

Loader that parses input JSON, YAML and Java .properties files consisting of messages as objects of JavaScript message functions with a matching structure, using [`messageformat`](https://messageformat.github.io/).

## Installation

```
npm install @messageformat/core @messageformat/loader
```

## Usage

### webpack.config.js

```js
{
  test: [/\bmessages\.(json|ya?ml)$/, /\.properties$/],
  type: 'javascript/auto', // required by Webpack 4
  loader: '@messageformat/loader',
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

The default option values are shown, and are not required. [See below](#options) for more information on them.

### messages.yaml

```yaml
simple: 'A simple message.'
var: 'Message with {X}.'
plural: 'You have {N, plural, =0{no messages} one{1 message} other{# messages}}.'
select: '{GENDER, select, male{He has} female{She has} other{They have}} sent you a message.'
ordinal: 'The {N, selectordinal, one{1st} two{2nd} few{3rd} other{#th}} message.'
```

### example.js

ES6, with configuration:

```js
import messages from './messages.yaml';
messages['ordinal']({ N: 1 });
// => 'The 1st message.'
```

ES5, without configuration:

```js
var messages = require('@messageformat/loader?locale=en!./messages.yaml');
messages['ordinal']({ N: 1 });
// => 'The 1st message.'
```

## Options

- `convert` Use [`@messageformat/convert`][convert] to convert non-MessageFormat syntax and plural objects into MessageFormat. Use an object value to configure. Defaults to `false`.
- `encoding` File encoding. Defaults to `'auto'`, which will auto-detect `'utf8'` and otherwise use `'latin1'`.
- `locale` The [CLDR language code] or codes to pass to [`MessageFormat`][mf]. If using multiple locales at the same time, exact matches to a locale code in the data structure keys will select that locale within it. Defaults to `'en'`.
- `propKeyPath` Parse dots `.` in .properties file keys as path separators, resulting in a multi-level message object. Defaults to `true`.

[MessageFormat options] are also supported, such as:

- `biDiSupport` Enable or disable the addition of Unicode control characters to all input to preserve the integrity of the output when mixing LTR and RTL text. Defaults to `false`.
- `customFormatters` Add custom formatter functions to this MessageFormat instance.
- `strictNumberSign` Follow the stricter ICU MessageFormat spec and throw a runtime error if # is used with non-numeric input. Defaults to `false`.

[mf]: https://messageformat.github.io/messageformat/api/core.messageformat/
[cldr language code]: http://www.unicode.org/cldr/charts/29/supplemental/language_territory_information.html
[convert]: https://github.com/messageformat/messageformat/tree/master/packages/convert
[messageformat options]: https://messageformat.github.io/messageformat/api/core.messageformatoptions/

---

[Messageformat](https://messageformat.github.io/) is an OpenJS Foundation project, and we follow its [Code of Conduct](https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md).

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
