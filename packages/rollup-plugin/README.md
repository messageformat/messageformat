# rollup-plugin-messageformat

File import plugin for [Rollup](https://rollupjs.org/) that lets you `import` JSON, YAML & .properties files containing ICU MessageFormat messages, turning them into message functions to use e.g. with [react-message-context](https://www.npmjs.com/package/react-message-context).

## Installation

```
npm install --save-dev rollup-plugin-messageformat@next
```

Internally, the plugin uses [messageformat@3](https://messageformat.github.io/messageformat/v3/), which has a runtime component. If you're intending to publish you bundle for others, you should also include that as a dependency:

```
npm install messageformat-runtime@next
```


## Usage

With this config:

```js
// rollup.config.js
import messageformat from 'rollup-plugin-messageformat'

export default {
  entry: 'src/app.js',
  external: /^messageformat-runtime\b/,
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

```js
// src/app.js
import fr from '../messages/fr.yaml'

fr.message_intro({ count: 3 })
// 'Vos 3 messages se trouvent ici.'
```

You'll get this output:

```js
import { plural, number } from 'messageformat-runtime';
import { fr as fr$1 } from 'messageformat-runtime/lib/cardinals';

var fr = {
  message_intro: function(d) { return plural(d.count, 0, fr$1, {
    one: "Votre message se trouve ici.",
    other: "Vos " + number("fr", d.count, 0) + " messages se trouvent ici."
  }) + "\\n"; }
};

fr.message_intro({ count: 3 });
// 'Vos 3 messages se trouvent ici.'
```

## Options

In addition to all [MessageFormat options](https://messageformat.github.io/messageformat/v3/MessageFormat#~Options__anchor), the following are supported. All are optional.

### `exclude: FilterPattern`

Files to exclude. A valid `minimatch` pattern, or an array of such patterns.

By default undefined.

### `include: FilterPattern`

Files to include. A valid `minimatch` pattern, or an array of such patterns.

By default, includes all `.properties` files and `.json`, `.yaml` & `.yml`
files that include `messages` before the extension. If locales are defined,
also matches `messages[./_-]lc.ext` where `lc` is the locale and `ext` one
of the above extensions.

Examples of default matches: `foo.properties`, `messages.json`,
`bar-messages.yaml`, `messages/en.json` (if the `en` locale is explicitly set)

### `locales: string | string[]`

Define the message locale or locales. If given multiple valid locales, the
first will be the default. Messages under matching locale keys or in a file
with a name that includes a locale key will use that for pluralisation.

If `locales` has the special value `'*'`, it will match *all* available
locales. This may be useful if you want your messages to be completely
determined by your data, but may provide surprising results if your input
message object includes any 2-3 character keys that are not locale
identifiers.

Default: `'en'`

### `propKeyPath: boolean`

If true, dots `.` in .properties file keys will be parsed as path
separators, resulting in a multi-level object.

Default: `true`

---

[Messageformat](https://messageformat.github.io/) is an OpenJS Foundation project, and we follow its [Code of Conduct](https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md).

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
