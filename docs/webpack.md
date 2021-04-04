---
title: Webpack
parent: Usage
nav_order: 4
---

# Webpack Loader for MessageFormat

A loader that parses input JSON, YAML and Java .properties files consisting of messages as objects of JavaScript message functions with a matching structure, all during the build of your application.

This package was previously named [messageformat-loader].

## Installation

```
npm install --save-dev @messageformat/core @messageformat/loader
```

If you're intending to publish a library with external dependencies, you should also include the [runtime] as a dependency:

```
npm install @messageformat/runtime
```

## Usage

After installation, you'll need to add the loader to your Webpack config.
Note the `test` value; you may want to customise the `messages` part to match whatever you're actually using, in particular if a generic match like `/\.yaml$/` would overlap with another loader.

### webpack.config.js

```js
module.exports = {
  module: {
    rules: [
      {
        test: [/\bmessages\.(json|ya?ml)$/, /\.properties$/],
        type: 'javascript/auto', // required by Webpack for JSON files
        loader: '@messageformat/loader',
        options: { locale: ['en'] }
      }
    ]
  }
};
```

With that in place, you'll be able to use your messages like this:

### messages.yaml

```yaml
simple: 'A simple message.'
var: 'Message with {X}.'
plural: 'You have {N, plural, =0{no messages} one{1 message} other{# messages}}.'
select: '{GENDER, select, male{He has} female{She has} other{They have}} sent you a message.'
ordinal: 'The {N, selectordinal, one{1st} two{2nd} few{3rd} other{#th}} message.'
```

### example.js

```js
import messages from './messages.yaml';

messages.ordinal({ N: 1 });
// → 'The 1st message.'
```

## Options

In addition to the [options accepted by @messageformat/core][options], the loader supports the following:

| Option        | Type                          | Default  | Description                                                                                                                               |
| ------------- | ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `convert`     | `boolean`                     | `false`  | Use [@messageformat/convert] to convert non-MessageFormat syntax and plural objects into MessageFormat. Use an object value to configure. |
| `encoding`    | `'auto'`/`'utf8'`/ `'latin1'` | `'auto'` | File encoding. With `'auto'`, attempts to detect `'utf8'`, falling back to `'latin1'`.                                                    |
| `locale`      | `string[]`                    | `['en']` | The [CLDR language codes] to pass to [`MessageFormat`][mf].                                                                               |
| `propKeyPath` | `boolean`                     | `true`   | Parse dots `.` in .properties file keys as path separators, resulting in a multi-level message object.                                    |

As MessageFormat is often used to provide multi-language support, it's important to include all of your supported locales in the `options.locale` value.
For example, using `locale: ['en', 'fr']` would allow for imports from `foo.en.properties` and `foo.fr.properties` to have their messages' locale set correctly, based on the file name.
Using a locale identifier as a key within the message file contents will also select that locale within it.

[messageformat-loader]: https://www.npmjs.com/package/messageformat-loader
[runtime]: https://messageformat.github.io/messageformat/api/runtime/
[options]: https://messageformat.github.io/messageformat/api/core.messageformatoptions/
[@messageformat/convert]: https://www.npmjs.com/package/@messageformat/convert
[cldr language codes]: http://www.unicode.org/cldr/charts/latest/supplemental/language_territory_information.html
[mf]: https://messageformat.github.io/messageformat/api/core.messageformat/
