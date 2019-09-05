This guide aims to provide an introduction to ICU MessageFormat syntax, along
with minimal code examples that are directly executable in a node.js
environment. **For production use**, we recommend using {@tutorial build} and
the {@link Messages} runtime accessor class.

## String Lookup

The simplest case of MessageFormat involves no formatting, just a string
passthrough. This may sound silly, but often it's nice to always use the same
message formatting system when doing translations, and not everything requires
variables.

```javascript
const MessageFormat = require('messageformat');
const mf = new MessageFormat('en');
const message = mf.compile('This is a message.');

message(); // "This is a message."
```

**Note**: if a message _does_ require data to be passed in, an error is thrown if
you do not.

## Variables

The most common way to use MessageFormat is for simple variable replacement.
MessageFormat may look odd at first, but it's actually fairly simple. One way to
think about the `{` and `}` is that every level of them bring you into and
out-of "literal" and "code" mode.

By default (like in the previous example), you are just writing a literal. Then
the first level of brackets brings you into one of several data-driven
situations. The most simple is variable replacement.

Simply putting a variable name in between `{` and `}` will place that variable
there in the output.

```javascript
const MessageFormat = require('messageformat');
const mf = new MessageFormat('en');
const varMessage = mf.compile('His name is {NAME}.');

varMessage({ NAME: 'Jed' }); // 'His name is Jed.'
```

## SelectFormat

SelectFormat is a lot like a switch statement for your messages. Often it's used
to select gender in a string. The format of the statement is `{varname, select, this{...} that{...} other{...}}`, where `varname` matches a key in the data you
give to the resulting function, and `'this'` and `'that'` are some of the
string-equivalent values that it may have. The `other` key is required, and is
selected if no other case matches.

**Note**: Comparison is made using the JavaScript `==` operator, so if a key is
left out of the input data, the case `undefined{...}` would match that.

```javascript
const MessageFormat = require('messageformat');
const mf = new MesssageFormat('en');
const selectMessage = mf.compile(
  `{ GENDER, select,
       male {He}
       female {She}
       other {They}
   } liked this.`
);

selectMessage({ GENDER: 'male' }); // 'He liked this.'
selectMessage({ GENDER: 'female' }); // 'She liked this.'
selectMessage({}); // 'They liked this.'
```

## PluralFormat

PluralFormat is a similar mechanism to SelectFormat, but specific to numerical
values. The key that is chosen is generated from the specified input variable by
a locale-specific _plural function_.

The numeric input is mapped to a plural category, some subset of `zero`, `one`,
`two`, `few`, `many`, and `other` depending on the locale and the type of plural.
English, for instance, uses `one` and `other` for cardinal plurals (e.g. "one
result", "many results") and `one`, `two`, `few`, and `other` for ordinal
plurals (e.g. "1st result", "2nd result", etc). For information on which keys
are used by your locale, please refer to the [CLDR table of plural rules].

For some languages, The number of printed digits is significant (e.g. "1 meter",
"1.0 meters"); to account for that you may pass in the value as a stringified
representation of the number.

Matches for exact values are available with the `=` prefix, e.g. `=0` and `=1`.

The keyword for cardinal plurals is `plural`, and for ordinal plurals is
`selectordinal`.

Within a plural statement, `#` will be replaced by the variable value.

[cldr table of plural rules]: http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html

```javascript
const MessageFormat = require('messageformat');
const mf = new MessageFormat('en');
const messages = mf.compile({
  results: `There { COUNT, plural,
                    =0 {are no results}
                    one {is one result}
                    other {are # results}
                  }.`,
  position: `You are { POS, selectordinal,
                       one {#st}
                       two {#nd}
                       few {#rd}
                       other {#th}
                     } in the queue.`
});

messages.results({ COUNT: 0 }); // 'There are no results.'
messages.results({ COUNT: 1 }); // 'There is one result.'
messages.results({ COUNT: 100 }); // 'There are 100 results.'
messages.position({ POS: 1 }); // 'You are 1st in the queue.'
messages.position({ POS: 33 }); // 'You are 33rd in the queue.'
```

### Plural Offset

To generate sentences such as "You and 4 others added this to their profiles.",
PluralFormat supports subtracting an `offset` from the variable value before
determining its plural category. Literal/exact matches are tested before
applying the offset.

```javascript
const MessageFormat = require('messageformat');
const mf = new MessageFormat('en');
const offsetMessage = mf.compile(
  `You { ADDS, plural, offset:1
         =0 {did not add this}
         =1 {added this}
         one {and one other person added this}
         other {and # others added this}
       }.`
);

offsetMessage({ ADDS: 0 }); // 'You did not add this.'
offsetMessage({ ADDS: 1 }); // 'You added this.'
offsetMessage({ ADDS: 2 }); // 'You and one other person added this.'
offsetMessage({ ADDS: 3 }); // 'You and 2 others added this.'
```

## Formatters

MessageFormat includes date, duration, number, and time formatting functions in
the style of ICU's [simpleArg syntax]. They are implemented using the [Intl]
object defined by ECMA-402.

**Note**: Intl is not defined in Node by default until 0.12 and is not available
in all browsers (in particular, IE <=10 and Safari <=9.1), so you may need to
use a [polyfill].

[simplearg syntax]: http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html
[intl]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
[polyfill]: https://www.npmjs.com/package/intl

### date

Supported parameters are `short`, `default`, `long` , or `full`.

```javascript
const MessageFormat = require('messageformat');
const mf = new MessageFormat(['en', 'fi']);
const messages = mf.compile({
  en: {
    today: 'Today is {T, date}',
    unix: 'Unix time started on {T, date, full}',
    uptime: '{sys} became operational on {d0, date, short}'
  },
  fi: {
    today: 'Tänään on {T, date}'
  }
});

messages.en.today({ T: Date.now() }); // 'Today is Mar 30, 2018'
messages.fi.today({ T: Date.now() }); // 'Tänään on 30. maalisk. 2018'
messages.en.unix({ T: 0 });
// 'Unix time started on Thursday, January 1, 1970'
messages.en.uptime({ sys: 'HAL 9000', d0: '12 January 1999' });
// 'HAL 9000 became operational on 1/12/1999'
```

### duration

Represent a duration in seconds as a string.

```javascript
const MessageFormat = require('messageformat');
const mf = new MessageFormat();
const messages = mf.compile({
  since: 'It has been {D, duration}',
  countdown: 'Countdown: {D, duration}'
});

messages.since({ D: 123 }); // 'It has been 2:03'
messages.countdown({ D: -151200.42 }); // 'Countdown: -42:00:00.420'
```

### number

Supported parameters are `integer`, `percent` , or `currency`. To specify a non-default currency, use `currency:CODE`.

```javascript
const MessageFormat = require('messageformat');
const mf = new MessageFormat('en');
mf.currency = 'EUR'; // needs to be set before first compile() call
const messages = mf.compile({
  almost: '{N} is almost {N, number, integer}',
  complete: '{P, number, percent} complete',
  currency: {
    eur: 'The total is {V, number, currency}.',
    gbp: 'The total is {V, number, currency:GBP}.'
  }
});

messages.almost({ N: 3.14 }); // '3.14 is almost 3'
messages.complete({ P: 0.99 }); // '99% complete'
messages.currency.eur({ V: 5.5 }); // 'The total is €5.50.'
messages.currency.gbp({ V: 5.5 }); // 'The total is £5.50.'
```

### time

Supported parameters are `short`, `default`, `long` , or `full`.

```javascript
const MessageFormat = require('messageformat')
const mf = new MessageFormat(['en', 'fi'])
const messages = mf.compile({
  now: {
    en: 'The time is now {T, time}',
    fi: 'Kello on nyt {T, time}'
  },
  eagle: 'The Eagle landed at {T, time, full} on {T, date, full}'
}

messages.now.en({ T: Date.now() })  // 'The time is now 11:26:35 PM'
messages.now.fi({ T: Date.now() })  // 'Kello on nyt 23.26.35'
messages.eagle({ T: '1969-07-20 20:17:40 UTC' })
  // 'The Eagle landed at 10:17:40 PM GMT+2 on Sunday, July 20, 1969'
```

### Custom Formatters

In MessageFormat source, a formatter function is called with the syntax
`{var, name, arg}`, where `var` is a variable, `name` is the formatter name
(by default, either `date`, `duration`, `number` or `time`; `spellout` and
`ordinal` are not supported by default), and `arg` is an optional string
argument.

In JavaScript, a formatter is a function called with three parameters:

- The **`value`** of the variable; this can be of any user-defined type
- The current **`locale`** code
- The trimmed **`arg`** string value, or `null` if not set

As formatter functions may be used in a precompiled context, they should not
refer to any variables that are not defined by the function parameters or
within the function body. To add your own formatter, use the `customFormatters`
option of the MessageFormat constructor.

```javascript
const MessageFormat = require('messageformat');
const customFormatters = {
  upcase: function(v) {
    return v.toUpperCase();
  },
  locale: function(v, lc) {
    return lc;
  },
  prop: function(v, lc, p) {
    return v[p];
  }
};
const mf = new MessageFormat('en-GB', { customFormatters });
const messages = mf.compile({
  describe: 'This is {VAR, upcase}.',
  locale: 'The current locale is {_, locale}.',
  answer: 'Answer: {obj, prop, a}'
});

messages.describe({ VAR: 'big' }); // 'This is BIG.'
messages.locale({}); // 'The current locale is en-GB.'
messages.answer({ obj: { q: 3, a: 42 } }); // 'Answer: 42'
```

## Nesting

All types of messageformat statements may be nested within each other, to unlimited depth:

```text
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

The characters `{` and `}` must be escaped with `'quotes'` to be included in the output as literal characters. Within plural statements, `#` must also be similarly escaped. The utility function {@link MessageFormat.escape} may help with this.

```javascript
const MessageFormat = require('messageformat');
const mf = new MessageFormat('en');
const messages = mf.compile({
  esc: "'{' {S, plural, other{# is a '#'}} '}'",
  var: MessageFormat.escape('Use {var} for variables')
});

messages.esc({ S: 5 }); // '{ 5 is a # }'
messages.var({ var: 5 }); // 'Use {var} for variables'
```
