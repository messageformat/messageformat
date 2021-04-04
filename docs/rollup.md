---
title: Rollup
parent: Usage
nav_order: 2
---

# Rollup Plugin for MessageFormat

Plugin for [Rollup] that lets you `import` JSON, YAML & .properties files containing ICU MessageFormat messages, turning them into message functions to use e.g. with [@messageformat/react].

## Installation

```
npm install --save-dev rollup-plugin-messageformat
```

If you're intending to publish a library with external dependencies, you should also include the [runtime] as a dependency:

```
npm install @messageformat/runtime
```

## Usage

With this config:

<!-- prettier-ignore -->
```js
// rollup.config.js
import messageformat from 'rollup-plugin-messageformat'

export default {
  entry: 'src/app.js',
  external: /^@messageformat\/runtime\b/,
  output: { format: 'es' },
  plugins: [messageformat({ locales: ['en', 'fr'] })]
}
```

And these source files:

```yaml
# messages/fr.yaml
message_intro: |
  {count, plural,
    one {Votre message se trouve ici.}
    other {Vos # messages se trouvent ici.}
  }
```

<!-- prettier-ignore -->
```js
// src/app.js
import fr from '../messages/fr.yaml'

fr.message_intro({ count: 3 })
// 'Vos 3 messages se trouvent ici.'
```

You'll get this output:

<!-- prettier-ignore -->
```js
import { plural, number } from '@messageformat/runtime';
import { fr as fr$1 } from '@messageformat/runtime/lib/cardinals';

var fr = {
  message_intro: (d) => plural(d.count, 0, fr$1, {
    one: "Votre message se trouve ici.",
    other: "Vos " + number("fr", d.count, 0) + " messages se trouvent ici."
  }) + "\\n"
};

fr.message_intro({ count: 3 });
// 'Vos 3 messages se trouvent ici.'
```

## Options

In addition to the [options accepted by @messageformat/core][options], the plugin supports the following. All are optional.

| Option        | Type            | Default          | Description                                                                                                                       |
| ------------- | --------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `exclude`     | `FilterPattern` |                  | Files to exclude. A valid `minimatch` pattern, or an array of such patterns.                                                      |
| `include`     | `FilterPattern` | (see&nbsp;below) | Files to include. A valid `minimatch` pattern, or an array of such patterns.                                                      |
| `locales`     | `string[]`      | `['en']`         | Define the message locale or locales using [CLDR language codes]. If given multiple valid locales, the first will be the default. |
| `propKeyPath` | `boolean`       | `true`           | Parse dots `.` in .properties file keys as path separators, resulting in a multi-level message object.                            |

### `include`

By default, includes all `.properties` files and `.json`, `.yaml` & `.yml` files that include `messages` before the extension.
If locales are defined, also matches `messages[./_-]lc.ext` where `lc` is the locale and `ext` one of the above extensions.

Examples of default matches: `foo.properties`, `messages.json`, `bar-messages.yaml`, `messages/en.json` (if the `en` locale is explicitly set)

### `locales`

As MessageFormat is often used to provide multi-language support, it's important to include all of your supported locales in the `locales` value.
For example, using `locales: ['en', 'fr']` would allow for imports from `foo.en.properties` and `foo.fr.properties` to have their messages' locale set correctly, based on the file name.
Using a locale identifier as a key within the message file contents will also select that locale within it.

If `locales` has the special value `'*'`, it will match _all_ available locales.
This may be useful if you want your messages to be completely determined by your data, but may provide surprising results if your input message object includes any 2-3 character keys that are not locale identifiers.

[rollup]: https://rollupjs.org/
[@messageformat/react]: https://www.npmjs.com/package/@messageformat/react
[options]: https://messageformat.github.io/messageformat/api/core.messageformatoptions/
[cldr language codes]: http://www.unicode.org/cldr/charts/latest/supplemental/language_territory_information.html
