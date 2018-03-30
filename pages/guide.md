## Contents
* [Variables](#variables)
* [SelectFormat](#selectformat)
* [PluralFormat](#pluralformat)
* [Intl Formatters](#intl-formatters)
* [Custom Formatters](#custom-formatters)
* [Nesting](#nesting)
* [Escaping](#escaping)


The simplest case of MessageFormat involves no formatting, just a string passthrough. This may sound silly, but often it's nice to always use the same message formatting system when doing translations, and not everything requires variables.

```javascript
const mf = new MessageFormat('en')
const message = mf.compile('This is a message.')

message()
  // "This is a message."
```

NOTE: if a message _does_ require data to be passed in, an error is thrown if you do not.


## Variables

The second most simple way to use MessageFormat is for simple variable replacement. MessageFormat may look odd at first, but it's actually fairly simple. One way to think about the `{` and `}` is that every level of them bring you into and out-of `literal` and `code` mode.

By default (like in the previous example), you are just writing a literal. Then the first level of brackets brings you into one of several data-driven situations. The most simple is variable replacement.

Simply putting a variable name in between `{` and `}` will place that variable there in the output.

```javascript
const mf = new MessageFormat('en')
const varMessage = mf.compile('His name is {NAME}.')

varMessage({ NAME : 'Jed' })
  // "His name is Jed."
```


## SelectFormat

`SelectFormat` is a lot like a switch statement for your messages. Often it's used to select gender in a string. The format of the statement is `{varname, select, thisvalue{...} thatvalue{...} other{...}}`, where `varname` matches a key in the data you give to the resulting function, and `'thisvalue'` & `'thatvalue'` are some of the string-equivalent values that it may have. The `other` key is required, and is selected if no other case matches.

Note that comparison is made using the JavaScript `==` operator, so if a key is left out of the input data, the case `undefined{...}` would match that.

```javascript
const mf = new MesssageFormat('en')
const selectMessage = mf.compile(
  '{GENDER, select, male{He} female{She} other{They}} liked this.'
)

selectMessage({ GENDER: 'male' })
  // "He liked this."

selectMessage({ GENDER: 'female' })
  // "She liked this."

selectMessage({})
  // "They liked this."
```


## PluralFormat

`PluralFormat` is a similar mechanism to `SelectFormat`, but specific to numerical values. The key that is chosen is generated from the specified input variable by a locale-specific _plural function_.

The numeric input is mapped to a plural category, some subset of `zero`, `one`, `two`, `few`, `many`, and `other` depending on the locale and the type of plural. English, for instance, uses `one` and `other` for cardinal plurals (one result, many results) and `one`, `two`, `few`, and `other` for ordinal plurals (1st result, 2nd result, etc). For information on which keys are used by your locale, please refer to the [CLDR table of plural rules](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html).

Matches for exact values are available with the `=` prefix.

The keyword for cardinal plurals is `plural`, and for ordinal plurals is `selectordinal`.

Within a plural statement, `#` will be replaced by the variable value.

```javascript
const mf = new MessageFormat('en')
const pluralMessage = mf.compile(
  'There {COUNT, plural, =0{are no results} one{is one result} other{are # results}}.'
)

pluralMessage({ COUNT: 0 })
  // "There are no results."

pluralMessage({ COUNT: 1 })
  // "There is one result."

pluralMessage({ COUNT: 100 })
  // "There are 100 results."
```


#### Offset extension

To generate sentences such as "You and 4 others added this to their profiles.", PluralFormat supports adding an `offset` to the variable value before determining its plural category. Literal/exact matches are tested before applying the offset.

```javascript
const mf = new MessageFormat('en')
const offsetMessage = mf.compile(
  `You {NUM_ADDS, plural, offset:1
    =0 {did not add this}
    =1 {added this}
    one {and one other person added this}
    other {and # others added this}
  }.`
)

offsetMessage({ NUM_ADDS: 0 })
  // "You did not add this."

offsetMessage({ NUM_ADDS: 1 })
  // "You added this."

offsetMessage({ NUM_ADDS: 2 })
  // "You and one other person added this."

offsetMessage({ NUM_ADDS: 3 })
  // "You and 2 others added this."
```


## Intl Formatters

MessageFormat also includes date, number, and time formatting functions in the style of ICU's [simpleArg syntax](http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html). They are implemented using the [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) object defined by ECMA-402.

**Note**: Intl is not defined in Node by default until 0.11.15 / 0.12.0 and is not available in all browsers, so you may need to use a [polyfill](https://www.npmjs.com/package/intl).

Because native or polyfilled support is not guaranteed, you must call `setIntlSupport()` on your MessageFormat object before these will be available.

### date

Supported parameters are 'short', 'default', 'long' , or 'full'.

```javascript
const mf = new MessageFormat(['en', 'fi']).setIntlSupport(true)

mf.compile('Today is {T, date}')({ T: Date.now() })
// 'Today is Feb 21, 2016'

mf.compile('Tänään on {T, date}', 'fi')({ T: Date.now() })
// 'Tänään on 21. helmikuuta 2016'

mf.compile('Unix time started on {T, date, full}')({ T: 0 })
// 'Unix time started on Thursday, January 1, 1970'

const cf = mf.compile('{sys} became operational on {d0, date, short}')
cf({ sys: 'HAL 9000', d0: '12 January 1999' })
// 'HAL 9000 became operational on 1/12/1999'
```

### number

Supported parameters are 'integer', 'percent' , or 'currency'.

```javascript
const mf = new MessageFormat('en').setIntlSupport(true)
mf.currency = 'EUR'  // needs to be set before first compile() call

mf.compile('{N} is almost {N, number, integer}')({ N: 3.14 })
// '3.14 is almost 3'

mf.compile('{P, number, percent} complete')({ P: 0.99 })
// '99% complete'

mf.compile('The total is {V, number, currency}.')({ V: 5.5 })
// 'The total is €5.50.'
```

### time

Supported parameters are 'short', 'default', 'long' , or 'full'.

```javascript
const mf = new MessageFormat(['en', 'fi']).setIntlSupport(true)

mf.compile('The time is now {T, time}')({ T: Date.now() })
// 'The time is now 11:26:35 PM'

mf.compile('Kello on nyt {T, time}', 'fi')({ T: Date.now() })
// 'Kello on nyt 23.26.35'

const cf = mf.compile('The Eagle landed at {T, time, full} on {T, date, full}')
cf({ T: '1969-07-20 20:17:40 UTC' })
// 'The Eagle landed at 10:17:40 PM GMT+2 on Sunday, July 20, 1969'
```


## Custom Formatters

MessageFormat also supports custom formatters. Call `addFormatters()` on your MessageFormat object and provide it with a map of formatter names to formatter functions. Given a string containing `{var, yourFormatterName, arg1, arg2}`, your callback will be called with three parameters: the value of the variable, the current locale, and an array of [arg1, arg2].


```javascript
const mf = new MessageFormat('en-GB')
mf.addFormatters({
  upcase: function(v) { return v.toUpperCase(); },
  locale: function(v, lc) { return lc; },
  prop: function(v, lc, p) { return v[p] }
})

mf.compile('This is {VAR, upcase}.')({ VAR: 'big' })
// 'This is BIG.'

mf.compile('The current locale is {_, locale}.')({ _: '' })
// 'The current locale is en-GB.'

mf.compile('Answer: {obj, prop, a}')({ obj: {q: 3, a: 42} })
// 'Answer: 42'
```


## Nesting

All types of messageformat statements may be nested within each other, to unlimited depth:

```text
{SEL1, select,
  other {
    {PLUR1, plural,
      one {1}
      other {
        {SEL2, select,
          other {Deep in the heart.}
        }
      }
    }
  }
}
```


## Escaping

The characters `{` and `}` must be escaped with a `\` to be included in the output as literal characters. Within plural statements, `#` must also be similarly escaped. Keep in mind that you'll need to double-escape with `\\` within e.g. JavaScript and JSON strings.

```javascript
const mf = new MessageFormat('en')
const escMessage = mf.compile('\\{ {S, plural, other{# is a \\#}} \\}')

escMessage({ S: 5 })
  // "{ 5 is a # }"
```
