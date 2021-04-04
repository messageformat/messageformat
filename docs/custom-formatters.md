---
title: Custom Formatters
parent: Format Guide
---

# Custom Formatters

Custom formatters are an extension of the ICU MessageFormat spec that's specific to this library.

In MessageFormat source, a formatter function is called with the syntax

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
formatters may also be defined as `{ formatter: CustomFormatter; id: string; module: string }`, which will result in them being imported to the module as the named export `id` of the module `module`.

This is intended to allow for third-party formatters to be more easily used,
and to work around the limitations of stringified functions needing to be completely independent of their surrounding context.
