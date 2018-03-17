# messageformat-parser  <a href="http://travis-ci.org/messageformat/parser"><img align="right" alt="Build Status" src="https://secure.travis-ci.org/messageformat/parser.png"></a>

A [PEG.js] parser for [ICU MessageFormat] strings – part of [messageformat].
Outputs an AST defined by [parser.pegjs].

The generated `parse(src, [options])` function takes two parameters, first the
string to be parsed, and a second optional parameter `options`, an object with
the following possible keys:

- `cardinal` and `ordinal` – Arrays of valid plural categories for the current
  locale, used to validate `plural` and `selectordinal` keys. If these are
  missing or set to false, the full set of valid [Unicode CLDR] keys is used:
  `'zero', 'one', 'two', 'few', 'many', 'other'`. To disable this check, pass in
  an empty array.

- `strictFunctionParams` – By default, function parameters are split on commas
  and trimmed, so the parameters in `{x,fn,   a,   b   }` are parsed as
  `['a','b']`. Setting `strictFunctionParams` to true will make the parser
  follow the ICU MessageFormat spec more closely, and result in a params array
  with a single element: `['   a,   b   ']`.

- `strictNumberSign` – Inside a `plural` or `selectordinal` statement, a pound
  symbol (`#`) is replaced with the input number. By default, `#` is also parsed
  as a special character in nested statements too, and can be escaped using
  apostrophes (`'#'`). Setting `strictNumberSign` to true will make the parser
  follow the ICU MessageFormat spec more closely, and only parse `#` as a
  special character directly inside a `plural` or `selectordinal` statement.
  Outside those, `#` and `'#'` will be parsed as literal text.

The parser only supports the default `DOUBLE_OPTIONAL` [apostrophe mode]. A
single apostrophe only starts quoted literal text if preceded by a curly brace
(`{}`) or a pound symbol (`#`) inside a `plural` or `selectordinal` statement,
depending on the value of `strictNumberSign`. Otherwise, it is a literal
apostrophe. A double apostrophe is always a literal apostrophe.

[ICU MessageFormat]: https://messageformat.github.io/guide/
[messageformat]: https://messageformat.github.io/
[parser.pegjs]: ./parser.pegjs
[PEG.js]: http://pegjs.org/
[Unicode CLDR]: http://cldr.unicode.org/index/cldr-spec/plural-rules
[apostrophe mode]: http://www.icu-project.org/apiref/icu4c/messagepattern_8h.html#af6e0757e0eb81c980b01ee5d68a9978b


## Installation

```sh
npm install messageformat-parser
```


## Usage

```js
> var parse = require('messageformat-parser').parse;

> parse('So {wow}.')
[ 'So ', { type: 'argument', arg: 'wow' }, '.' ]

> parse('Such { thing }. { count, selectordinal, one {First} two {Second}' +
        '                  few {Third} other {#th} } word.')
[ 'Such ',
  { type: 'argument', arg: 'thing' },
  '. ',
  { type: 'selectordinal',
    arg: 'count',
    offset: 0,
    cases:
     [ { key: 'one', tokens: [ 'First' ] },
       { key: 'two', tokens: [ 'Second' ] },
       { key: 'few', tokens: [ 'Third' ] },
       { key: 'other', tokens: [ { type: 'octothorpe' }, 'th' ] } ] },
  ' word.' ]

> parse('Many{type,select,plural{ numbers}selectordinal{ counting}' +
                         'select{ choices}other{ some {type}}}.')
[ 'Many',
  { type: 'select',
    arg: 'type',
    cases:
     [ { key: 'plural', tokens: [ ' numbers' ] },
       { key: 'selectordinal', tokens: [ ' counting' ] },
       { key: 'select', tokens: [ ' choices' ] },
       { key: 'other', tokens: [ ' some',
                                 { type: 'argument', arg: 'type' } ] } ] },
  '.' ]

> parse('{Such compliance')
// SyntaxError: Expected ",", "}" or [ \t\n\r] but "c" found.

> var msg = '{words, plural, zero{No words} one{One word} other{# words}}';
> var englishKeys = { cardinal: [ 'one', 'other' ],
                      ordinal: [ 'one', 'two', 'few', 'other' ] };
> parse(msg)
[ { type: 'plural',
    arg: 'words',
    offset: 0,
    cases:
     [ { key: 'zero', tokens: [ 'No words' ] },
       { key: 'one', tokens: [ 'One word' ] },
       { key: 'other', tokens: [ { type: 'octothorpe' }, ' words' ] } ] } ]

> parse(msg, englishKeys)
// Error: Invalid key `zero` for argument `words`. Valid plural keys for this
//        locale are `one`, `other`, and explicit keys like `=0`.
```

For more example usage, please take a look at our [test suite](./test.js).


## Structure

The output of `parse()` is a `Token` array:

```typescript
type Token = string | Argument | Plural | Select | Function

type Argument = {
  type: 'argument',
  arg: Identifier
}

type Plural = {
  type: 'plural' | 'selectordinal',
  arg: Identifier,
  offset: number,
  cases: PluralCase[]
}

type Select = {
  type: 'select',
  arg: Identifier,
  cases: SelectCase[]
}

type Function = {
  type: 'function',
  arg: Identifier,
  key: Identifier,
  params: string[]
}

type PluralCase = {
  key: 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' | '=0' | '=1' | '=2' | ...,
  tokens: (Token | Octothorpe)[]
}

type SelectCase = {
  key: Identifier,
  tokens: strictNumberSign ? Token[] : (Token | Octothorpe)[]
}

type Octothorpe = {
  type: 'octothorpe'
}

type Identifier = string  // not containing whitespace or control characters
```


## License & Contributor License Agreement
Released under the MIT license. See the [messageformat README][CLA] for details.

[CLA]: https://github.com/messageformat/messageformat.js#contributor-license-agreement
