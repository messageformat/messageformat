---
title: Format Guide
nav_order: 4
has_children: true
---

<!-- prettier-ignore-start -->
# Format Guide
{: .no_toc }

## Contents
{: .no_toc .text-delta }

1. TOC
{:toc}
<!-- prettier-ignore-end -->

---

This guide aims to provide an introduction to ICU MessageFormat syntax, as supported by this project.

Each of the sample messages is shown first as MessageFormat source, and then with a JS result.
Except where otherwise specified, the `msg` function may be determined as follows:

```js
import MessageFormat from '@messageformat/core';

const mf = new MessageFormat('en');
const msg = mf.compile(msgSrc);
```

## String Lookup

The simplest case of MessageFormat involves no formatting, just a string passthrough.
This may sound silly, but often it's nice to always use the same message formatting system when doing translations, and not everything requires variables.

```
This is a message.
```

```js
msg(); // 'This is a message.'
```

## Variables

The most common way to use MessageFormat is for simple variable replacement.
MessageFormat may look odd at first, but it's actually fairly simple.
One way to think about the `{` and `}` is that every level of them bring you into and out-of "literal" and "code" mode.
Whitespace (including newlines) is ignored when not in literal mode.

By default (as in the previous example), you are just writing a literal.
Then the first level of brackets brings you into one of several data-driven situations.
The most simple is variable replacement.

Simply putting a variable name in between `{` and `}` will place that variable there in the output.

```
His name is {NAME}.
```

```js
msg({ NAME: 'Jed' }); // 'His name is Jed.'
```

## SelectFormat

SelectFormat is a lot like a switch statement for your messages.
Often it's used to select gender in a string.
The format of the statement is `{varname, select, this{...} that{...} other{...}}`, where `varname` matches a key in the data you give to the resulting function, and `'this'` and `'that'` are some of the string-equivalent values that it may have.
The `other` key is required, and is selected if no other case matches.

**Note**: Comparison is made using the JavaScript `==` operator, so if a key is left out of the input data, the case `undefined{...}` would match that.

```
{ GENDER, select,
    male {He}
    female {She}
    other {They}
} liked this.
```

```js
msg({ GENDER: 'male' }); // 'He liked this.'
msg({ GENDER: 'female' }); // 'She liked this.'
msg({}); // 'They liked this.'
```

## PluralFormat

PluralFormat is a similar mechanism to SelectFormat, but specific to numerical values.
The key that is chosen is generated from the specified input variable by a locale-specific _plural function_.

The numeric input is mapped to a plural category, some subset of `zero`, `one`, `two`, `few`, `many`, and `other` depending on the locale and the type of plural.
English, for instance, uses `one` and `other` for cardinal plurals (e.g. "one result", "many results") and `one`, `two`, `few`, and `other` for ordinal plurals (e.g. "1st result", "2nd result", etc).
For information on which keys are used by your locale, please refer to the [CLDR table of plural rules](https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html).

For some languages, the number of printed digits is significant (e.g. "1 meter", "1.0 meters"); to account for that you may pass in the number using its stringified representation of the number (as produced by `String(n)`).

Matches for exact values are available with the `=` prefix, e.g. `=0` and `=1`.

The keyword for cardinal plurals is `plural`, and for ordinal plurals is `selectordinal`.

Within a plural statement, `#` will be replaced by the variable value, formatted as a number in the current locale.

```
{ COUNT, plural,
    =0 {There are no results.}
    one {There is one result.}
    other {There are # results.}
}
```

<!-- prettier-ignore-start -->
```js
msg({ COUNT: 0 }); // 'There are no results.'
msg({ COUNT: 1 }); // 'There is one result.'
msg({ COUNT: 100 }); // 'There are 100 results.'
```
{: .mb-6 }
<!-- prettier-ignore-end -->

```
You are { POS, selectordinal,
          one {#st}
          two {#nd}
          few {#rd}
          other {#th}
        } in the queue.
```

```js
msg({ POS: 1 }); // 'You are 1st in the queue.'
msg({ POS: 33 }); // 'You are 33rd in the queue.'
```

### Plural Offset

To generate sentences such as "You and 4 others added this to their profiles.", PluralFormat supports subtracting an `offset` from the variable value before determining its plural category.
Literal/exact matches are tested before applying the offset.

```
{ ADDS, plural, offset:1
  =0 {No-one has added this}
  =1 {You added this}
  one {You and one other person added this}
  other {You and # others added this}
}
```

```js
msg({ ADDS: 1 }); // 'You added this.'
msg({ ADDS: 2 }); // 'You and one other person added this.'
msg({ ADDS: 3 }); // 'You and 2 others added this.'
```

## Formatters

MessageFormat includes date, duration, number, and time formatting functions in the style of ICU's [simpleArg syntax].
They are implemented using the [Intl] object defined by ECMA-402.
Be aware that even relatively recent versions of browsers may have incomplete or non-standard support for all advanced features used by the date and number formatter skeletons.

See alse [Custom Formatters](custom-formatters.md) for an extension of the spec provided by this library.

[simplearg syntax]: http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html
[intl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl

### date and time

For simple cases, both `date` and `time` support the parameters `short`, `default`, `long` , and `full`.
For more precide date and time formatting, use `date` with a `::`-prefixed [DateFormat skeleton string](http://userguide.icu-project.org/formatparse/datetime) like `{T, date, ::hamszzzz}`

```
It is now {T, time} on {T, date}
```

<!-- prettier-ignore-start -->
```js
msg({ T: Date.now() }); // 'It is now 11:26:35 PM on Mar 30, 2018'
```
{: .mb-6 }

```
{sys} became operational on {d0, date, short}
```

```js
msg({ sys: 'HAL 9000', d0: '12 January 1999' }); // 'HAL 9000 became operational on 1/12/1999'
```
{: .mb-6 }
<!-- prettier-ignore-end -->

Date and time formatting is of course locale-dependent, so using the Finnish `'fi'` locale, we would have:

```
Nyt on {T, date}, klo {T, time}
```

```js
msg({ T: Date.now() }); // 'Nyt on 30. maalisk. 2018, klo 23.26.35'
```

### duration

Represent a duration in seconds as a string.

```
It has been {D, duration}
```

```js
msg({ D: 123 }); // 'It has been 2:03'
msg({ D: -151200.42 }); // 'It has been -42:00:00.420'
```

### number

Supported simple parameters are `integer`, `percent` , or `currency`.
For more options, use a [NumberFormat skeleton string](https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md).
Most [NumberFormat patterns](http://unicode.org/reports/tr35/tr35-numbers.html#Number_Format_Patterns) are also supported.

```
{N} is almost {N, number, integer}
```

<!-- prettier-ignore-start -->
```js
msg({ N: 3.14 }); // '3.14 is almost 3'
```
{: .mb-6 }
<!-- prettier-ignore-end -->

```
The total is {V, number, ::currency/GBP unit-width-narrow}.
```

```js
msg({ V: 5.5 }); // 'The total is £5.50.'
```

## Nesting

All types of messageformat statements may be nested within each other, to unlimited depth:

```
{ SEL1, select,
  other {
    { PLUR1, plural,
      one {1}
      other {
        { SEL2, select, other {Deep in the heart.} }
      }
    }
  }
}
```

## Escaping

The characters `{` and `}` must be escaped with `'quotes'` to be included in the output as literal characters.
Within plural statements, `#` must also be similarly escaped.
The utility function [MessageFormat.escape](api/core.messageformat.escape.md) may help with this.

```
'{' {S, plural, other{# is a '#'}} '}'
```

<!-- prettier-ignore-start -->
```js
msg({ S: 5 }); // '{ 5 is a # }'
```
{: .mb-6 }
<!-- prettier-ignore-end -->

```js
import MessageFormat from '@messageformat/core';

const mf = new MessageFormat('en');

const rawSrc = 'Use {var} for variables';
const raw = mf.compile(rawSrc);
raw(); // TypeError: Cannot read property 'var' of undefined

const msgSrc = MessageFormat.escape(rawSrc);
const msg = mf.compile(msgSrc);
msg(); // 'Use {var} for variables'
```
