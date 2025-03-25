---
title: Custom Formatters
parent: ICU MessageFormat Syntax
---

# Custom Formatters

Custom formatters are an extension of the ICU MessageFormat spec that's specific to this library.

In message source, a formatter function is called with the syntax

```
{var, name, arg}
```

where `var` is a variable name, `name` is the formatter name, and `arg` is an optional string argument.

As a further extension of the spec, the `arg` value itself may contain any MessageFormat syntax, such as references to other variables.

In JavaScript, a custom formatter may be defined as a function that is called with three arguments:

- The **`value`** of the variable; this can be of any user-defined type
- The current **`locale`** code as a string
- The **`arg`** value, or `null` if it is not set

To define and add your own formatter, use the `customFormatters` option of the MessageFormat constructor:

```js
import MessageFormat from '@messageformat/core';

const mf = new MessageFormat('en-GB', {
  customFormatters: {
    locale: (_, lc) => lc,
    upcase: v => v.toUpperCase()
  }
});

const msg = mf.compile('This is {VAR, upcase} in {_, locale}.');
msg({ VAR: 'big' }); // 'This is BIG in en-GB.'
```

For compiled modules (e.g. when using with the [Webpack loader](webpack.md) or [Rollup plugin](rollup.md)),
formatters may also be defined as an object with the following properties:

- `formatter: CustomFormatter` – The formatter function, for live use
- `id: string` and `module` should both be defined if either is,
  to provide for importing the formatter as `id` from `module` in the compiled code.
  This is intended to allow for third-party formatters to be more easily used,
  and to work around the limitations of stringified functions
  needing to be completely independent of their surrounding context.
  `module` may either be a `string`,
  or a function `(locale: string) => string` if the import path has a locale dependency.
- `arg` defines shape in which any argument object will get passed to the formatter, using one of the following values:
  - `'string'` (default) will pass any argument as a trimmed `string`.
  - `'raw'` provides an `Array` of values, which will be `string` for literals, but may include e.g. runtime variable values.
  - `'options'` requires its value to be literal, but will then parse that as a `Record<string, string | number | boolean | null>` shape,
    using a very simple parser that first splits the string on each `,` and for each pair considers trimmed content before the first `:` as the key and the rest as the (also trimmed) value.
    If the value matches `true`, `false`, `null`, or the JSON representation of a number, it will be parsed as the corresponding type.
    No form of escaping is provided for.

Putting all that together, if we had this module available:

```js
// '@messageformat/upcase'

export function formatter(value, locale, override) {
  const lc = (override && override.locale) || locale;
  return String(value).toLocaleUpperCase(lc);
}

export const upcase = {
  formatter,
  arg: 'options',
  id: 'formatter',
  module: '@messageformat/upcase'
};
```

We can use it like this:

```js
import MessageFormat from '@messageformat/core';
import compileModule from '@messageformat/core/compile-module';
import { upcase } from '@messageformat/upcase';

const mf = new MessageFormat('en', { customFormatters: { upcase } });
const msgSet = {
  here: 'This is {x, upcase} here',
  fin: 'This is {x, upcase, locale: fi} in Finnish'
};
compileModule(mf, msgSet);
```

Resulting in this compiled module:

```js
import { formatter as upcase } from '@messageformat/upcase';
export default {
  here: d => 'This is ' + upcase(d.x, 'en') + ' here',
  fin: d => 'This is ' + upcase(d.x, 'en', { locale: 'fi' }) + ' in Finnish'
};
```

In the prior example, the formatting module `upcase` had to handle every locale
under compilation. Formatting modules may also be authored on a per-locale
basis. This may be useful in various scenarios, for example when bundling or
compiling code along the locale dimension.
